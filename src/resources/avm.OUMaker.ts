import type { CreateOrganizationalUnitCommandOutput, OrganizationalUnit } from '@aws-sdk/client-organizations'
import type { CloudFormationCustomResourceEvent, CloudFormationCustomResourceResponse } from 'aws-lambda'
import type * as winston from 'winston'
import * as process from 'node:process'
import { CreateOrganizationalUnitCommand, OrganizationsClient } from '@aws-sdk/client-organizations'
import { S3Client } from '@aws-sdk/client-s3'
import { createLogger, getOuRootId, getOuTree, lookupParentOuId } from './util'

const logger = createLogger()

const s3Client = new S3Client({})
const organizationsClient = new OrganizationsClient({})

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
      PhysicalResourceId: event.PhysicalResourceId,
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
    }
  }

  const ouData = await getOuTree(logger, s3Client, ouFileBucket, ouFileKey)

  for (const organizationalUnit of ouData) {
    await new Promise(f => setTimeout(f, 1000))
    if (organizationalUnit.Name) {
      let parentId: string
      try {
        const rootId = await getOuRootId(logger, organizationsClient)
        if (organizationalUnit.Parent === 'Root') {
          parentId = rootId
        }
        else {
          parentId = await lookupParentOuId(logger, organizationsClient, organizationalUnit.Parent, rootId)
        }
      }
      catch (error) {
        logger.error(`Cannot proceed without Parent ID: ${(error as Error).message}`)
        throw error
      }

      await createOrganizationalUnit(logger, organizationsClient, organizationalUnit, parentId)
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

async function createOrganizationalUnit(logger: winston.Logger, client: OrganizationsClient, organizationalUnit: OrganizationalUnit, parentId: string): Promise<void> {
  let response: CreateOrganizationalUnitCommandOutput
  try {
    response = await client.send(new CreateOrganizationalUnitCommand({
      Name: organizationalUnit.Name!,
      ParentId: parentId,
    }))
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
