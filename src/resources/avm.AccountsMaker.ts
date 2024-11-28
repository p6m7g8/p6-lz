import type { CreateAccountCommandOutput } from '@aws-sdk/client-organizations'
import type { CloudFormationCustomResourceEvent, CloudFormationCustomResourceResponse } from 'aws-lambda'
import type * as winston from 'winston'
import type { IP6LzAccount } from '../types'
import * as process from 'node:process'
import { CreateAccountCommand, DuplicateAccountException, MoveAccountCommand, OrganizationsClient } from '@aws-sdk/client-organizations'
import { S3Client } from '@aws-sdk/client-s3'
import { createLogger, getAccountCurrentOuId, getAccountIdByEmail, getAccounts, getOuRootId, getOuTree, isAccountEmailTaken, lookupOuId, lookupParentOuId, waitForAccountCreation } from './util'

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

  const ouTree = await getOuTree(logger, s3Client, ouFileBucket, ouFileKey)
  const accountData = await getAccounts(logger, s3Client, accountsFileBucket, accountsFileKey)

  for (const account of accountData) {
    if (account.SraType === 'management') {
      continue
    }
    await new Promise(f => setTimeout(f, 2000))

    if (!account.Name || !account.Email || !account.OrganizationalUnitName) {
      logger.warn(
        'Account entry missing required fields: Name, Email, or OrganizationalUnitName',
      )
      continue
    }

    // Lookup Target OU ID
    const tmpOu = ouTree.find((ou: any) => ou.Name === account.OrganizationalUnitName)
    const parentOuName = tmpOu?.Parent ?? ''
    logger.info(`Found OU: ${tmpOu?.Name} with parent: ${parentOuName}`)

    const rootId = await getOuRootId(logger, organizationsClient)
    const parentOuId = await lookupParentOuId(logger, organizationsClient, parentOuName, rootId)
    const ouId = await lookupOuId(logger, organizationsClient, account.OrganizationalUnitName, parentOuId)

    account.AccountId = await createAccount(logger, organizationsClient, account) ?? ''

    // Lookup the CURRENT OU ID
    const currentOuId = await getAccountCurrentOuId(logger, organizationsClient, account.AccountId!) // source

    moveAccount(logger, organizationsClient, account, currentOuId, ouId)
  }

  return {
    Status: 'SUCCESS',
    PhysicalResourceId: event.RequestId,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
  }
}

async function createAccount(logger: winston.Logger, client: OrganizationsClient, account: IP6LzAccount): Promise<string | undefined> {
  const emailExists = await isAccountEmailTaken(logger, client, account.Email!)

  if (emailExists) {
    logger.info(`Account creation skipped: Email ${account.Email} is already in use.`)
    const accountId = await getAccountIdByEmail(logger, client, account.Email!)
    return accountId
  }

  let response: CreateAccountCommandOutput
  try {
    response = await client.send(new CreateAccountCommand({
      AccountName: account.Name!,
      Email: account.Email!,
    }))
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

async function moveAccount(logger: winston.Logger, client: OrganizationsClient, account: IP6LzAccount, currentAccountOuId: string, ouId: string): Promise<void> {
  if (currentAccountOuId === ouId) {
    logger.info(`Account ${account.Name} is already in ${ouId}. Skipping move.`)
    return
  }

  try {
    await client.send(new MoveAccountCommand({
      AccountId: account.AccountId,
      SourceParentId: currentAccountOuId,
      DestinationParentId: ouId,
    }))
    logger.info(
      `Moved account: ${account.Name} (ID: ${account.AccountId}) under OU ID: ${ouId}`,
    )
  }
  catch (error) {
    if (error instanceof DuplicateAccountException) {
      logger.warn(`Account ${account.Name} already exists under the specified parent. Skipping move.`)
    }
    else {
      logger.error(
        `Failed to move account ${account.Name} to OU ${ouId}: ${(error as Error).message}`,
      )
      throw error
    }
  }
}
