import type { CreateAccountCommandOutput, ListAccountsCommandOutput } from '@aws-sdk/client-organizations'
import type { CloudFormationCustomResourceEvent, CloudFormationCustomResourceResponse } from 'aws-lambda'
import type * as winston from 'winston'
import type { ExtendedAccount } from './types'
import * as process from 'node:process'
import { CreateAccountCommand, DuplicateAccountException, ListAccountsCommand, MoveAccountCommand, OrganizationsClient } from '@aws-sdk/client-organizations'
import { S3Client } from '@aws-sdk/client-s3'
import { createLogger, getAccounts, getOUTree, getRootId, isEmailTaken, lookupParentId, waitForAccountCreation } from './util'

const logger = createLogger()

const s3Client = new S3Client({})
const organizationsClient = new OrganizationsClient({})

export async function handler(event: CloudFormationCustomResourceEvent): Promise<CloudFormationCustomResourceResponse> {
  const accountsFileBucket = process.env.ACCOUNTS_FILE_BUCKET
  const accountsFileKey = process.env.ACCOUNTS_FILE_KEY
  const ouFileBucket = process.env.OU_FILE_BUCKET
  const ouFileKey = process.env.OU_FILE_KEY

  if (!ouFileBucket || !ouFileKey || !accountsFileBucket || !accountsFileKey) {
    logger.error(
      'Environment variables OU_FILE_BUCKET, OU_FILE_KEY, ACCOUNTS_FILE_BUCKET, ACCOUNTS_FILE_KEY are required',
    )
    throw new Error('Missing environment configuration for OU creation')
  }

  if (event.RequestType === 'Delete' || event.RequestType === 'Update') {
    logger.info(`No action required for ${event.RequestType} event`)
    return {
      Status: 'SUCCESS',
      PhysicalResourceId: event.PhysicalResourceId,
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
    }
  }

  const ouTree = await getOUTree(logger, s3Client, ouFileBucket, ouFileKey)
  const accountData = await getAccounts(logger, s3Client, accountsFileBucket, accountsFileKey)
  const rootId = await getRootId(logger, organizationsClient)

  for (const account of accountData) {
    await new Promise(f => setTimeout(f, 1000))

    if (!account.Name || !account.Email || !account.OrganizationalUnitName) {
      logger.warn(
        'Account entry missing required fields: Name, Email, or OrganizationalUnitName',
      )
      continue
    }

    const ou = ouTree.find(ou => ou.Name === account.OrganizationalUnitName)
    logger.info(`Found OU: ${JSON.stringify(ou)}`)
    const parentOU = ou?.Parent ?? ''
    const parentOUId = await lookupParentId(logger, organizationsClient, parentOU, rootId)
    logger.info(`Found parent OU ID: ${parentOUId}`)

    account.Id = await createAccount(logger, organizationsClient, account)
    moveAccount(logger, organizationsClient, account, parentOUId, parentOU, rootId)
  }

  return {
    Status: 'SUCCESS',
    PhysicalResourceId: event.RequestId,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
  }
}

async function getAccountIdByEmail(logger: winston.Logger, client: OrganizationsClient, email: string): Promise<string | undefined> {
  const listAccountsCommand = new ListAccountsCommand({})
  let response: ListAccountsCommandOutput
  try {
    response = await client.send(listAccountsCommand)
  }
  catch (error) {
    logger.error(`Failed to list accounts by email ${email}: ${(error as Error).message}`)
    throw error
  }

  const account = response.Accounts?.find(account => account.Email === email)

  return account?.Id
}

async function createAccount(logger: winston.Logger, client: OrganizationsClient, account: ExtendedAccount): Promise<string | undefined> {
  const emailExists = await isEmailTaken(logger, client, account.Email!)

  if (emailExists) {
    logger.info(`Account creation skipped: Email ${account.Email} is already in use.`)
    const accountId = await getAccountIdByEmail(logger, client, account.Email!)
    return accountId
  }

  let response: CreateAccountCommandOutput
  const createAccountCommand = new CreateAccountCommand({
    AccountName: account.Name!,
    Email: account.Email!,
  })
  try {
    response = await client.send(createAccountCommand)
  }
  catch (error) {
    logger.error(`Failed to create account ${account.Name} with email ${account.Email}: ${(error as Error).message}`)
    throw error
  }

  const createAccountRequestId = response.CreateAccountStatus?.Id
  if (!createAccountRequestId) {
    logger.error(`CreateAccountStatus ID is missing for ${account.Name}`)
    throw new Error(`CreateAccountStatus ID is missing for ${account.Name}`)
  }

  const accountId = await waitForAccountCreation(logger, client, createAccountRequestId)

  return accountId
}

async function moveAccount(logger: winston.Logger, client: OrganizationsClient, account: ExtendedAccount, parentOUId: string, parentOUName: string, rootOuId: string): Promise<void> {
  const moveAccountCommand = new MoveAccountCommand({
    AccountId: account.Id,
    SourceParentId: rootOuId,
    DestinationParentId: parentOUId,
  })
  try {
    await client.send(moveAccountCommand)
    logger.info(
      `Created account: ${account.Name} (ID: ${account.Id}) under OU ID: ${parentOUId}`,
    )
  }
  catch (error) {
    if (error instanceof DuplicateAccountException) {
      logger.warn(`Account ${account.Name} already exists under the specified parent. Skipping move.`)
    }
    else {
      logger.error(
        `Failed to move account ${account.Name} to OU ${parentOUName}: ${(error as Error).message}`,
      )
      throw error
    }
  }
}
