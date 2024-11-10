import type { Context, ScheduledEvent } from 'aws-lambda'
import type { Logger } from 'winston'
import * as process from 'node:process'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { CreateAccountCommand, DescribeCreateAccountStatusCommand, OrganizationsClient } from '@aws-sdk/client-organizations'
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import winston from 'winston'

// Configure the logger
const logger: Logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.Console(),
  ],
})

const org = new OrganizationsClient({})
const ddbClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(ddbClient)
const tableName = process.env.TABLE_NAME

async function scanDynamoDB() {
  const scanCommand = new ScanCommand({
    TableName: tableName,
    FilterExpression: 'attribute_not_exists(#status) OR #status <> :status',
    ExpressionAttributeNames: {
      '#status': 'status',
    },
    ExpressionAttributeValues: {
      ':status': 'SUCCESS',
    },
  })

  return docClient.send(scanCommand)
}

async function processItem(item: any, requestId: string) {
  logger.info('Processing item', { item })

  try {
    const response = await org.send(
      new CreateAccountCommand({
        Email: item.email,
        AccountName: item.name,
        IamUserAccessToBilling: 'ALLOW',
      }),
    )
    logger.info('CreateAccountCommand response', { response })

    const createAccountRequestId = response.CreateAccountStatus?.Id
    if (!createAccountRequestId) {
      throw new Error('CreateAccountStatus Id not found.')
    }

    const isSuccess = await pollAccountCreationStatus(createAccountRequestId)
    if (isSuccess) {
      await updateItemStatus(item.name)
    }
    else {
      logger.error('Account creation failed', { item })
    }
  }
  catch (error) {
    logger.error('Error creating account', { requestId, item, error })
  }
}

async function pollAccountCreationStatus(createAccountRequestId: string): Promise<boolean> {
  while (true) {
    const describeResponse = await org.send(
      new DescribeCreateAccountStatusCommand({
        CreateAccountRequestId: createAccountRequestId,
      }),
    )
    logger.info('DescribeCreateAccountStatus response', { describeResponse })

    const status = describeResponse.CreateAccountStatus?.State
    logger.info(`status: [${status}]`)

    if (status === 'SUCCEEDED') {
      return true
    }
    else if (status === 'FAILED') {
      return false
    }

    await new Promise(resolve => setTimeout(resolve, 5000))
  }
}

async function updateItemStatus(itemName: string) {
  const updateCommand = new UpdateCommand({
    TableName: tableName,
    Key: { name: itemName },
    UpdateExpression: 'SET #status = :status',
    ExpressionAttributeNames: {
      '#status': 'status',
    },
    ExpressionAttributeValues: {
      ':status': 'SUCCESS',
    },
  })

  await docClient.send(updateCommand)
}

export async function handler(event: ScheduledEvent, context: Context): Promise<boolean> {
  logger.info('Scheduled Event Triggered', { requestId: context.awsRequestId, timestamp: event.time })

  try {
    const result = await scanDynamoDB()

    if (result.Count && result.Items) {
      logger.info('Items found in DynamoDB table', { requestId: context.awsRequestId, items: result.Items })

      for (const item of result.Items) {
        await processItem(item, context.awsRequestId)
      }
    }
    else {
      logger.info('No items found in DynamoDB table', { requestId: context.awsRequestId })
    }
  }
  catch (error) {
    logger.error('Error scanning DynamoDB table', { requestId: context.awsRequestId, error })
    return false
  }

  return true
}
