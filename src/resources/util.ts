import type { DescribeCreateAccountStatusResponse, ListAccountsCommandOutput, ListOrganizationalUnitsForParentCommandOutput, ListRootsCommandOutput, OrganizationsClient } from '@aws-sdk/client-organizations'
import type { GetObjectCommandOutput, S3Client } from '@aws-sdk/client-s3'
import type { Readable } from 'node:stream'
import type { ExtendedAccounts, MyOrganizationalUnits } from './types'
import { DescribeCreateAccountStatusCommand, ListAccountsCommand, ListOrganizationalUnitsForParentCommand, ListRootsCommand } from '@aws-sdk/client-organizations'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import * as yaml from 'js-yaml'
import * as winston from 'winston'

export async function getAccounts(logger: winston.Logger, s3Client: S3Client, accountsFileBucket: string, accountsFileKey: string): Promise<ExtendedAccounts> {
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
  return accountData
}

export async function getOUTree(logger: winston.Logger, client: S3Client, ouFileBucket: string, ouFileKey: string): Promise<MyOrganizationalUnits> {
  let s3Object: GetObjectCommandOutput
  try {
    logger.info(`Fetching OU file from s3://${ouFileBucket}/${ouFileKey}`)
    const command = new GetObjectCommand({ Bucket: ouFileBucket, Key: ouFileKey })
    s3Object = await client.send(command)
  }
  catch (error) {
    logger.error(`Failed to retrieve OU file: ${(error as Error).message}`)
    throw error
  }

  if (!s3Object.Body) {
    logger.error('Failed to retrieve OU file content')
    throw new Error('OU file is empty')
  }

  let ouData: MyOrganizationalUnits
  try {
    const bodyString = await streamToString(s3Object.Body as Readable)
    ouData = yaml.load(bodyString) as MyOrganizationalUnits
    logger.info(`Parsed ${ouData.length} organizational units from the file`)
  }
  catch (error) {
    logger.error(`Failed to parse OU file: ${(error as Error).message}`)
    throw error
  }
  return ouData
}

export async function isEmailTaken(logger: winston.Logger, client: OrganizationsClient, email: string): Promise<boolean> {
  let nextToken: string | undefined
  let response: ListAccountsCommandOutput
  const listAccountsCommand = new ListAccountsCommand({
    NextToken: nextToken,
  })
  do {
    try {
      response = await client.send(listAccountsCommand)
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
  const delay = 15000 // 15 seconds

  for (let i = 0; i < maxRetries; i++) {
    let status: string | undefined
    let response: DescribeCreateAccountStatusResponse
    const describeCommand = new DescribeCreateAccountStatusCommand({
      CreateAccountRequestId: createAccountRequestId,
    })
    try {
      response = await client.send(describeCommand)
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

export async function lookupParentId(logger: winston.Logger, client: OrganizationsClient, parentName: string, rootId: string): Promise<string> {
  if (parentName === 'Root') {
    return rootId
  }

  const command = new ListOrganizationalUnitsForParentCommand({ ParentId: rootId })
  let response: ListOrganizationalUnitsForParentCommandOutput
  try {
    response = await client.send(command)
  }
  catch (error) {
    logger.error(`Error looking up parent ID for ${parentName}: ${(error as Error).message}`)
    throw error
  }

  const organizationalUnit = response.OrganizationalUnits?.find(
    ou => ou.Name === parentName,
  )

  if (!organizationalUnit || !organizationalUnit.Id) {
    throw new Error(`Parent organizational unit with name ${parentName} not found`)
  }

  return organizationalUnit.Id
}

export async function getRootId(logger: winston.Logger, client: OrganizationsClient): Promise<string> {
  let response: ListRootsCommandOutput
  const command = new ListRootsCommand({})
  try {
    response = await client.send(command)
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
