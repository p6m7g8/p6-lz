import type { Context, ScheduledEvent } from 'aws-lambda'
import type { Logger } from 'winston'
import * as process from 'node:process'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { CreateOrganizationalUnitCommand, ListOrganizationalUnitsForParentCommand, OrganizationsClient } from '@aws-sdk/client-organizations'
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb'
import winston from 'winston'

// Configure the logger
const logger: Logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'ou-structuring-service' },
  transports: [
    new winston.transports.Console(),
  ],
})

const ddbClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(ddbClient)
const orgClient = new OrganizationsClient({})
const TABLE_NAME = process.env.TABLE_NAME
const ROOT_OU_ID = process.env.ROOT_OU_ID

export async function handler(event: ScheduledEvent, context: Context): Promise<boolean> {
  logger.info('Scheduled Event Triggered', { requestId: context.awsRequestId, timestamp: event.time })

  try {
    const ouStructure = await getOrganizationUnitStructure()
    logger.info('Structured Organization Units', { ouStructure })

    await createOUsRecursively(ouStructure, ROOT_OU_ID!)
  }
  catch (error) {
    logger.error('Error structuring Organization Units', { requestId: context.awsRequestId, error })
    return false
  }

  return true
}

async function getOrganizationUnitStructure(): Promise<any> {
  const scanCommand = new ScanCommand({ TableName: TABLE_NAME })
  const result = await docClient.send(scanCommand)

  if (!result.Items || result.Count === 0) {
    throw new Error('No items found in OrganizationUnits table')
  }

  const ouMap: Record<string, any> = {}
  const rootOUs: any[] = []

  result.Items.forEach((item) => {
    ouMap[item.id] = { ...item, children: [] }
  })

  result.Items.forEach((item) => {
    if (item.parent && ouMap[item.parent]) {
      ouMap[item.parent].children.push(ouMap[item.id])
    }
    else {
      rootOUs.push(ouMap[item.id])
    }
  })

  return rootOUs
}

async function createOUsRecursively(ous: any[], parentId: string) {
  for (const ou of ous) {
    const existingOuId = await getExistingOuId(parentId, ou.name)

    const ouId = existingOuId ?? await createOrganizationalUnit(parentId, ou.name)
    if (ou.children && ou.children.length > 0) {
      await createOUsRecursively(ou.children, ouId)
    }
  }
}

async function getExistingOuId(parentId: string, ouName: string): Promise<string | null> {
  const listCommand = new ListOrganizationalUnitsForParentCommand({ ParentId: parentId })
  const result = await orgClient.send(listCommand)
  const existingOu = result.OrganizationalUnits?.find(ou => ou.Name === ouName)
  return existingOu?.Id ?? null
}

async function createOrganizationalUnit(parentId: string, ouName: string): Promise<string> {
  logger.info('Creating Organizational Unit', { ouName, parentId })
  const createCommand = new CreateOrganizationalUnitCommand({
    ParentId: parentId,
    Name: ouName,
  })
  const response = await orgClient.send(createCommand)
  logger.info('Organizational Unit Created', { ouName, ouId: response.OrganizationalUnit?.Id })
  return response.OrganizationalUnit!.Id!
}
