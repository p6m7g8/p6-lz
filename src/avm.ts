import type { Construct } from 'constructs'
import * as path from 'node:path'
import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdajs from 'aws-cdk-lib/aws-lambda-nodejs'
import { Asset } from 'aws-cdk-lib/aws-s3-assets'
import * as cr from 'aws-cdk-lib/custom-resources'
import * as floyd from 'cdk-iam-floyd'

const OU_FILE = 'conf/ou.yml'
const ACCOUNTS_FILE = 'conf/accounts.yml'

export class AVMStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props)

    const ouFileAsset = new Asset(this, 'OUFileAsset', {
      path: path.join(__dirname, '..', OU_FILE),
    })

    this.createOUs(ouFileAsset)
    this.createAccounts(ouFileAsset)
  }

  private createAccounts(ouFileAsset: Asset) {
    const accountsFileAsset = new Asset(this, 'AccountFileAsset', {
      path: path.join(__dirname, '..', ACCOUNTS_FILE),
    })

    const accountsFunction = new lambdajs.NodejsFunction(this, 'AccountsMaker', {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.minutes(6),
      tracing: lambda.Tracing.ACTIVE,
      entry: path.join(__dirname, '..', 'src', 'resources', 'avm.AccountsMaker.ts'),
      environment: {
        ACCOUNTS_FILE_BUCKET: accountsFileAsset.s3BucketName,
        ACCOUNTS_FILE_KEY: accountsFileAsset.s3ObjectKey,
        OU_FILE_BUCKET: ouFileAsset.s3BucketName,
        OU_FILE_KEY: ouFileAsset.s3ObjectKey,
      },
      bundling: {
        nodeModules: ['aws-sdk', 'aws-lambda', 'js-yaml', 'winston'],
      },
    })
    accountsFileAsset.grantRead(accountsFunction)
    const policy = new floyd.Statement.Organizations()
      .allow()
      .toCreateAccount()
      .toDescribeCreateAccountStatus()
      .toListAccounts()
      .toListOrganizationalUnitsForParent()
      .toListRoots()
      .toListParents()
      .toMoveAccount()
    accountsFunction.addToRolePolicy(policy)

    // Create a custom resource to trigger the Lambda function on each deploy
    const customResourceProvider = new cr.Provider(this, 'AccountsProvider', {
      onEventHandler: accountsFunction,
    })

    new cdk.CustomResource(this, 'AccountsCustomResource', {
      serviceToken: customResourceProvider.serviceToken,
    })
  }

  private createOUs(ouFileAsset: Asset) {
    const ouFunction = new lambdajs.NodejsFunction(this, 'OUMaker', {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.minutes(1),
      tracing: lambda.Tracing.ACTIVE,
      entry: path.join(__dirname, '..', 'src', 'resources', 'avm.OUMaker.ts'),
      environment: {
        OU_FILE_BUCKET: ouFileAsset.s3BucketName,
        OU_FILE_KEY: ouFileAsset.s3ObjectKey,
      },
      bundling: {
        nodeModules: ['aws-sdk', 'aws-lambda', 'js-yaml', 'winston'],
      },
    })
    ouFileAsset.grantRead(ouFunction)
    const policy = new floyd.Statement.Organizations()
      .allow()
      .toCreateOrganizationalUnit()
      .toListOrganizationalUnitsForParent()
      .toListRoots()
    ouFunction.addToRolePolicy(policy)

    // Create a custom resource to trigger the Lambda function on each deploy
    const customResourceProvider = new cr.Provider(this, 'OUProvider', {
      onEventHandler: ouFunction,
    })

    new cdk.CustomResource(this, 'OUCustomResource', {
      serviceToken: customResourceProvider.serviceToken,
    })
  }
}
