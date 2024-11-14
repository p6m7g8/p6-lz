import type { DescribeCreateAccountStatusResponse, ListAccountsCommandOutput, ListOrganizationalUnitsForParentCommandOutput, ListParentsCommandOutput, ListRootsCommandOutput, OrganizationsClient } from '@aws-sdk/client-organizations'
import type { GetObjectCommandOutput, S3Client } from '@aws-sdk/client-s3'
import type { Readable } from 'node:stream'
import type { ExtendedAccounts, MyOrganizationalUnits } from './types'
import { DescribeCreateAccountStatusCommand, ListAccountsCommand, ListOrganizationalUnitsForParentCommand, ListParentsCommand, ListRootsCommand } from '@aws-sdk/client-organizations'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import * as yaml from 'js-yaml'
import * as winston from 'winston'

export async function getOuTree(logger: winston.Logger, client: S3Client, ouFileBucket: string, ouFileKey: string): Promise<MyOrganizationalUnits> {
  const s3Object = await getOuFile(logger, client, ouFileBucket, ouFileKey)
  const ouData = await parseOu(logger, s3Object)
  return ouData
}

export async function getAccounts(logger: winston.Logger, client: S3Client, accountsFileBucket: string, accountsFileKey: string): Promise<ExtendedAccounts> {
  const s3Object = await getAccountsFile(logger, client, accountsFileBucket, accountsFileKey)
  const accountsData = await parseAccounts(logger, s3Object)
  return accountsData
}

export async function getAccountIdByEmail(logger: winston.Logger, client: OrganizationsClient, email: string): Promise<string | undefined> {
  let response: ListAccountsCommandOutput
  try {
    response = await client.send(new ListAccountsCommand({}))
  }
  catch (error) {
    logger.error(`Failed to list accounts by email ${email}: ${(error as Error).message}`)
    throw error
  }

  const account = response.Accounts?.find(account => account.Email === email)

  return account?.Id
}

export async function getAccountCurrentOuId(logger: winston.Logger, client: OrganizationsClient, accountId: string): Promise<string> {
  let response: ListParentsCommandOutput
  try {
    response = await client.send(new ListParentsCommand({
      ChildId: accountId,
    }))
  }
  catch (error) {
    logger.error(`Failed to list accounts: ${(error as Error).message}`)
    throw error
  }

  if (!response.Parents || response.Parents.length === 0) {
    logger.error(`Account ${accountId} has no parent`)
    throw new Error(`Account ${accountId} has no parent`)
  }

  const parentOuId = response.Parents[0]?.Id

  return parentOuId ?? ''
}

export async function lookupOuId(logger: winston.Logger, client: OrganizationsClient, ouName: string, parentOuId: string): Promise<string> {
  logger.info(`Looking up ID for ${ouName}`)

  let response: ListOrganizationalUnitsForParentCommandOutput
  try {
    response = await client.send(new ListOrganizationalUnitsForParentCommand({ ParentId: parentOuId }))
  }
  catch (error) {
    logger.error(`Error looking up ID for ${ouName}: ${(error as Error).message}`)
    throw error
  }

  const organizationalUnit = response.OrganizationalUnits?.find(
    ou => ou.Name === ouName,
  )

  if (!organizationalUnit || !organizationalUnit.Id) {
    throw new Error(`Organizational unit with name ${ouName} not found`)
  }

  logger.info(`Found OU: ${organizationalUnit.Name}, ID: ${organizationalUnit.Id}`)

  return organizationalUnit.Id
}

export async function lookupParentOuId(logger: winston.Logger, client: OrganizationsClient, ouName: string, rootId: string): Promise<string> {
  logger.info(`Looking up Parent ID for ${ouName}`)

  if (ouName === 'Root') {
    logger.info('Ou is Root')
    return rootId
  }

  let response: ListOrganizationalUnitsForParentCommandOutput
  try {
    response = await client.send(new ListOrganizationalUnitsForParentCommand({ ParentId: rootId }))
  }
  catch (error) {
    logger.error(`Error looking up Parent ID for ${ouName}: ${(error as Error).message}`)
    throw error
  }

  const organizationalUnit = response.OrganizationalUnits?.find(
    ou => ou.Name === ouName,
  )

  if (!organizationalUnit || !organizationalUnit.Id) {
    throw new Error(`Organizational unit with name ${ouName} not found`)
  }

  logger.info(`Found OU: ${organizationalUnit.Name}, ID: ${organizationalUnit.Id}`)

  return organizationalUnit.Id
}

export async function getOuRootId(logger: winston.Logger, client: OrganizationsClient): Promise<string> {
  let response: ListRootsCommandOutput
  try {
    response = await client.send(new ListRootsCommand({}))
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

export async function isAccountEmailTaken(logger: winston.Logger, client: OrganizationsClient, email: string): Promise<boolean> {
  let nextToken: string | undefined
  let response: ListAccountsCommandOutput
  do {
    try {
      response = await client.send(new ListAccountsCommand({
        NextToken: nextToken,
      }))
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

export async function waitForAccountCreation(logger: winston.Logger, client: OrganizationsClient, createAccountRequestId: string): Promise<string> {
  const maxRetries = 20
  const delay = 15000

  for (let i = 0; i < maxRetries; i++) {
    let response: DescribeCreateAccountStatusResponse
    try {
      response = await client.send(new DescribeCreateAccountStatusCommand({ CreateAccountRequestId: createAccountRequestId }))
    }
    catch (error) {
      logger.error(`Error while checking account creation status: ${(error as Error).message}`)
      throw error
    }

    const status: string | undefined = response.CreateAccountStatus?.State

    if (status === 'SUCCEEDED') {
      const accountId = response.CreateAccountStatus?.AccountId
      if (accountId) {
        return accountId
      }
      else {
        logger.error('Account creation succeeded but AccountId is missing')
        throw new Error('Account creation succeeded but AccountId is missing')
      }
    }
    else if (status === 'FAILED') {
      const failureReason = response.CreateAccountStatus?.FailureReason
      logger.error(`Account creation failed: ${failureReason}`)
      throw new Error(`Account creation failed: ${failureReason}`)
    }
    else {
      logger.info(`Account creation in progress... (${i + 1}/${maxRetries})`)
    }
    await new Promise(resolve => setTimeout(resolve, delay))
  }
  logger.error('Account creation timed out')
  throw new Error('Account creation timed out')
}

async function getOuFile(logger: winston.Logger, client: S3Client, ouFileBucket: string, ouFileKey: string): Promise<GetObjectCommandOutput> {
  let s3Object: GetObjectCommandOutput
  try {
    logger.info(`Fetching OU file from s3://${ouFileBucket}/${ouFileKey}`)
    s3Object = await client.send(new GetObjectCommand({
      Bucket: ouFileBucket,
      Key: ouFileKey,
    }))
  }
  catch (error) {
    logger.error(`Failed to retrieve OU file: ${(error as Error).message}`)
    throw error
  }

  if (!s3Object.Body) {
    logger.error('Failed to retrieve OU file content')
    throw new Error('OU file is empty')
  }
  return s3Object
}

async function parseOu(logger: winston.Logger, s3Object: GetObjectCommandOutput): Promise<MyOrganizationalUnits> {
  let ouData: MyOrganizationalUnits
  try {
    const bodyString = await streamToString(s3Object.Body as Readable)
    ouData = yaml.load(bodyString) as MyOrganizationalUnits
    logger.info(`Parsed ${ouData.length} OUs from the file`)
  }
  catch (error) {
    logger.error(`Failed to parse OU file: ${(error as Error).message}`)
    throw error
  }
  return ouData
}

async function getAccountsFile(logger: winston.Logger, client: S3Client, accountsFileBucket: string, accountsFileKey: string): Promise<GetObjectCommandOutput> {
  let s3Object: GetObjectCommandOutput
  try {
    logger.info(`Fetching accounts file from s3://${accountsFileBucket}/${accountsFileKey}`)
    s3Object = await client.send(new GetObjectCommand({
      Bucket: accountsFileBucket,
      Key: accountsFileKey,
    }))
  }
  catch (error) {
    logger.error(`Failed to retrieve accounts file: ${(error as Error).message}`)
    throw error
  }

  if (!s3Object.Body) {
    logger.error('Failed to retrieve accounts file content')
    throw new Error('Accounts file is empty')
  }
  return s3Object
}

async function parseAccounts(logger: winston.Logger, s3Object: GetObjectCommandOutput): Promise<ExtendedAccounts> {
  let accountData: ExtendedAccounts
  try {
    const bodyString = await streamToString(s3Object.Body as Readable)
    accountData = yaml.load(bodyString) as ExtendedAccounts
    logger.info(`Parsed ${accountData.length} accounts from the file`)
  }
  catch (error) {
    logger.error(`Failed to parse accounts file: ${(error as Error).message}`)
    throw error
  }
  return accountData
}

async function streamToString(stream: Readable): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const decoder = new TextDecoder('utf-8')
    let result = ''

    stream.on('data', (chunk: Uint8Array) => {
      result += decoder.decode(chunk, { stream: true })
    })

    stream.on('error', reject)

    stream.on('end', () => {
      result += decoder.decode()
      resolve(result)
    })
  })
}

export function createLogger() {
  return winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
      }),
    ],
  })
}
