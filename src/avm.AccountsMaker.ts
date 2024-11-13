import type { Account, CreateAccountCommandOutput, DescribeCreateAccountStatusResponse, ListAccountsCommandOutput, ListRootsCommandOutput, OrganizationalUnit } from '@aws-sdk/client-organizations'
import type { GetObjectCommandOutput } from '@aws-sdk/client-s3'
import type { CloudFormationCustomResourceEvent, CloudFormationCustomResourceResponse } from 'aws-lambda'
import type { Readable } from 'node:stream'
import * as process from 'node:process'
import {
  CreateAccountCommand,
  DescribeCreateAccountStatusCommand,
  ListAccountsCommand,
  ListOrganizationalUnitsForParentCommand,
  ListRootsCommand,
  MoveAccountCommand,
  OrganizationsClient,
} from '@aws-sdk/client-organizations'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import * as yaml from 'js-yaml'
import * as winston from 'winston'

// Extend the Account type to include OrganizationalUnitName
interface ExtendedAccount extends Account {
  OrganizationalUnitName?: string
}

type ExtendedAccounts = ExtendedAccount[]
type OrganizationalUnits = OrganizationalUnit[]

const s3Client = new S3Client({})
const organizationsClient = new OrganizationsClient({})

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
})

async function streamToString(stream: Readable): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    // eslint-disable-next-line node/prefer-global/buffer
    const chunks: Buffer[] = []
    // eslint-disable-next-line node/prefer-global/buffer
    stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    stream.on('error', reject)
    // eslint-disable-next-line node/prefer-global/buffer
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
  })
}

async function waitForAccountCreation(createAccountRequestId: string): Promise<string> {
  const maxRetries = 20
  const delay = 15000 // 15 seconds

  for (let i = 0; i < maxRetries; i++) {
    let status: string | undefined
    let response: DescribeCreateAccountStatusResponse
    const describeCommand = new DescribeCreateAccountStatusCommand({
      CreateAccountRequestId: createAccountRequestId,
    })
    try {
      response = await organizationsClient.send(describeCommand)
      status = response.CreateAccountStatus?.State
    }
    catch (error) {
      logger.error(`Error while checking account creation status: ${(error as Error).message}`)
      throw error
    }

    if (status === 'SUCCEEDED') {
      const accountId = response.CreateAccountStatus?.AccountId
      if (accountId) {
        return accountId
      }
      else {
        throw new Error('Account creation succeeded but AccountId is missing')
      }
    }
    else if (status === 'FAILED') {
      const failureReason = response.CreateAccountStatus?.FailureReason
      throw new Error(`Account creation failed: ${failureReason}`)
    }
    else {
      logger.info(`Account creation in progress... (${i + 1}/${maxRetries})`)
    }
    await new Promise(resolve => setTimeout(resolve, delay))
  }
  throw new Error('Account creation timed out')
}

async function getRootId(): Promise<string> {
  let response: ListRootsCommandOutput
  const command = new ListRootsCommand({})
  try {
    response = await organizationsClient.send(command)
  }
  catch (error) {
    logger.error(`Failed to list roots: ${(error as Error).message}`)
    throw error
  }

  if (response.Roots && response.Roots.length > 0) {
    const rootId = response.Roots[0]!.Id
    logger.info(`Retrieved Root ID: ${rootId}`)
    return rootId!
  }
  else {
    logger.error('No Roots found in the organization.')
    throw new Error('No Roots found in the organization.')
  }
}

async function isEmailTaken(email: string): Promise<boolean> {
  let nextToken: string | undefined
  let response: ListAccountsCommandOutput
  const listAccountsCommand = new ListAccountsCommand({
    NextToken: nextToken,
  })
  do {
    try {
      response = await organizationsClient.send(listAccountsCommand)
    }
    catch (error) {
      logger.error(`Error while listing accounts: ${(error as Error).message}`)
      throw error
    }
    if (response.Accounts) {
      for (const account of response.Accounts) {
        if (account.Email && account.Email.toLowerCase() === email.toLowerCase()) {
          return true
        }
      }
    }
    nextToken = response.NextToken
  } while (nextToken)

  return false
}

async function createAccount(account: ExtendedAccount, parentOU: OrganizationalUnit): Promise<void> {
  const emailExists = await isEmailTaken(account.Email!)

  if (emailExists) {
    logger.info(`Account creation skipped: Email ${account.Email} is already in use.`)
    return undefined
  }

  let response: CreateAccountCommandOutput
  const createAccountCommand = new CreateAccountCommand({
    AccountName: account.Name!,
    Email: account.Email!,
  })
  try {
    response = await organizationsClient.send(createAccountCommand)
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

  const accountId: string = await waitForAccountCreation(createAccountRequestId)

  const moveAccountCommand = new MoveAccountCommand({
    AccountId: accountId,
    SourceParentId: 'root',
    DestinationParentId: parentOU.Id!,
  })
  try {
    await organizationsClient.send(moveAccountCommand)
    logger.info(
      `Created account: ${account.Name} (ID: ${accountId}) under OU ID: ${parentOU.Id}`,
    )
  }
  catch (error) {
    logger.error(
      `Failed to move account ${account.Name} to OU ${parentOU.Name}: ${
        (error as Error).message
      }`,
    )
    throw error
  }
}

export async function handler(event: CloudFormationCustomResourceEvent): Promise<CloudFormationCustomResourceResponse> {
  const accountsFileBucket = process.env.ACCOUNTS_FILE_BUCKET
  const accountsFileKey = process.env.ACCOUNTS_FILE_KEY

  if (!accountsFileBucket || !accountsFileKey) {
    logger.error(
      'Environment variables ACCOUNTS_FILE_BUCKET and ACCOUNTS_FILE_KEY are required',
    )
    throw new Error('Missing environment configuration for account creation')
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

  let s3Object: GetObjectCommandOutput
  try {
    logger.info(`Fetching accounts file from s3://${accountsFileBucket}/${accountsFileKey}`)
    const getObjectCommand = new GetObjectCommand({
      Bucket: accountsFileBucket,
      Key: accountsFileKey,
    })
    s3Object = await s3Client.send(getObjectCommand)
    if (!s3Object.Body) {
      logger.error('Failed to retrieve accounts file content')
      throw new Error('Accounts file is empty')
    }
  }
  catch (error) {
    logger.error(`Failed to retrieve accounts file: ${(error as Error).message}`)
    throw error
  }

  let accountData
  try {
    const s3Data = await streamToString(s3Object.Body as Readable)
    accountData = yaml.load(s3Data) as ExtendedAccounts
    logger.info(`Parsed ${accountData.length} accounts from the file`)
  }
  catch (error) {
    logger.error(`Failed to parse accounts file: ${(error as Error).message}`)
    throw error
  }

  const rootID = await getRootId()

  // Fetch all Organizational Units under the root
  let organizationalUnits: OrganizationalUnits = []
  try {
    const listOUsCommand = new ListOrganizationalUnitsForParentCommand({
      ParentId: rootID,
    })
    const listOUsResponse = await organizationsClient.send(listOUsCommand)
    organizationalUnits = listOUsResponse.OrganizationalUnits || []
  }
  catch (error) {
    logger.error(`Failed to list Organizational Units: ${(error as Error).message}`)
    throw error
  }

  for (const account of accountData) {
    if (!account.Name || !account.Email || !account.OrganizationalUnitName) {
      logger.warn(
        'Account entry missing required fields: Name, Email, or OrganizationalUnitName',
      )
      continue
    }

    const parentOU = organizationalUnits.find(ou => ou.Name === account.OrganizationalUnitName)

    if (!parentOU) {
      logger.warn(
        `Organizational Unit ${account.OrganizationalUnitName} not found, skipping account creation for ${account.Name}`,
      )
      continue
    }

    await createAccount(account, parentOU)
  }

  return {
    Status: 'SUCCESS',
    PhysicalResourceId: event.RequestId,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
  }
}
