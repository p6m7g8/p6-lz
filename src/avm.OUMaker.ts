import type { CreateOrganizationalUnitCommandOutput, ListRootsCommandOutput, OrganizationalUnit } from '@aws-sdk/client-organizations'
import type { GetObjectCommandOutput } from '@aws-sdk/client-s3'
import type { CloudFormationCustomResourceEvent, CloudFormationCustomResourceResponse } from 'aws-lambda'
import type { Readable } from 'node:stream'
import * as process from 'node:process'
import { CreateOrganizationalUnitCommand, ListRootsCommand, OrganizationsClient } from '@aws-sdk/client-organizations'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import * as yaml from 'js-yaml'
import * as winston from 'winston'

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

async function createOrganizationalUnit(organizationalUnit: OrganizationalUnit, parentId: string): Promise<void> {
  let response: CreateOrganizationalUnitCommandOutput
  const command = new CreateOrganizationalUnitCommand({
    Name: organizationalUnit.Name!,
    ParentId: parentId,
  })
  try {
    response = await organizationsClient.send(command)
  }
  catch (error) {
    if ((error as any).name === 'DuplicateOrganizationalUnitException') {
      logger.warn(`OU "${organizationalUnit.Name}" already exists under ${parentId} the specified parent. Skipping creation.`)
      return
    }
    else {
      logger.error(`Failed to create OU ${organizationalUnit.Name}: ${(error as Error).message}`)
      throw error
    }
  }

  if (response.OrganizationalUnit) {
    logger.info(`Created OU: ${organizationalUnit.Name}, ID: ${response.OrganizationalUnit.Id}`)
  }
  else {
    logger.warn(`OU creation returned no organizational unit for ${organizationalUnit.Name}`)
  }
}

export async function handler(event: CloudFormationCustomResourceEvent): Promise<CloudFormationCustomResourceResponse> {
  const ouFileBucket = process.env.OU_FILE_BUCKET
  const ouFileKey = process.env.OU_FILE_KEY

  if (!ouFileBucket || !ouFileKey) {
    logger.error(
      'Environment variables OU_FILE_BUCKET and OU_FILE_KEY are required',
    )
    throw new Error('Missing environment configuration for OU creation')
  }

  if (event.RequestType === 'Delete' || event.RequestType === 'Update') {
    logger.info(`No action required for ${event.RequestType} event`)
    return {
      Status: 'SUCCESS',
      PhysicalResourceId: event.RequestId,
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
    }
  }

  let s3Object: GetObjectCommandOutput
  try {
    logger.info(`Fetching OU file from s3://${ouFileBucket}/${ouFileKey}`)
    const command = new GetObjectCommand({ Bucket: ouFileBucket, Key: ouFileKey })
    s3Object = await s3Client.send(command)
  }
  catch (error) {
    logger.error(`Failed to retrieve OU file: ${(error as Error).message}`)
    throw error
  }

  if (!s3Object.Body) {
    logger.error('Failed to retrieve OU file content')
    throw new Error('OU file is empty')
  }

  let ouData: OrganizationalUnits
  try {
    const bodyString = await streamToString(s3Object.Body as Readable)
    ouData = yaml.load(bodyString) as OrganizationalUnits
    logger.info(`Parsed ${ouData.length} organizational units from the file`)
  }
  catch (error) {
    logger.error(`Failed to parse OU file: ${(error as Error).message}`)
    throw error
  }

  let rootId: string
  try {
    rootId = await getRootId()
  }
  catch (error) {
    logger.error(`Cannot proceed without Root ID: ${(error as Error).message}`)
    throw error
  }

  for (const organizationalUnit of ouData) {
    await new Promise(f => setTimeout(f, 1000))
    if (organizationalUnit.Name) {
      await createOrganizationalUnit(organizationalUnit, rootId)
    }
    else {
      logger.warn('Encountered an OU entry without a name')
    }
  }

  return {
    Status: 'SUCCESS',
    PhysicalResourceId: event.RequestId,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
  }
}
