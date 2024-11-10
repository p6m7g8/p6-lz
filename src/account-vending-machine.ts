import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as events from 'aws-cdk-lib/aws-events'
import * as targets from 'aws-cdk-lib/aws-events-targets'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdajs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as floyd from 'cdk-iam-floyd'

export class AccountVendingMachineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props)

    const avmTable = this.createAccountsTable()
    this.createAVMFunction(avmTable)

    const ouTable = this.createOuTable()
    this.createOUFunction(ouTable)
  }

  private createAccountsTable(): dynamodb.Table {
    return new dynamodb.Table(this, 'AccountTable', {
      partitionKey: { name: 'name', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    })
  }

  private createOuTable(): dynamodb.Table {
    return new dynamodb.Table(this, 'OUTable', {
      partitionKey: { name: 'name', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    })
  }

  private createAVMFunction(table: dynamodb.Table): lambda.Function {
    const avmLambda = new lambdajs.NodejsFunction(this, 'AccountVendingMachine', {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.minutes(3),
      tracing: lambda.Tracing.ACTIVE,
      bundling: {
        minify: true,
      },
      environment: {
        TABLE_NAME: table.tableName,
      },
    })
    table.grantReadWriteData(avmLambda)

    const policy = new floyd.Statement.Organizations().allow().toCreateAccount()
    avmLambda.addToRolePolicy(policy)

    new events.Rule(this, 'OUScheduleRule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(15)),
      targets: [new targets.LambdaFunction(avmLambda)],
    })

    return avmLambda
  }

  private createOUFunction(table: dynamodb.Table): lambda.Function {
    const ouLambda = new lambdajs.NodejsFunction(this, 'OrganizationUnits', {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.minutes(1),
      tracing: lambda.Tracing.ACTIVE,
      bundling: {
        minify: true,
      },
      environment: {
        TABLE_NAME: table.tableName,
      },
    })
    table.grantReadData(ouLambda)

    const policy = new floyd.Statement.Organizations().allow().toCreateOrganizationalUnit().toListOrganizationalUnitsForParent()
    ouLambda.addToRolePolicy(policy)

    new events.Rule(this, 'AccountVendingMachineScheduleRule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(15)),
      targets: [new targets.LambdaFunction(ouLambda)],
    })

    return ouLambda
  }
}
