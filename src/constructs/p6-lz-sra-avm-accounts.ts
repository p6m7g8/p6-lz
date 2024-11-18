import type { Construct } from 'constructs'
import * as path from 'node:path'
import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdajs from 'aws-cdk-lib/aws-lambda-nodejs'
import { Asset } from 'aws-cdk-lib/aws-s3-assets'
import * as cr from 'aws-cdk-lib/custom-resources'
import * as floyd from 'cdk-iam-floyd'

const ACCOUNTS_FILE = 'conf/accounts.yml'

export interface IP6LzSraAvmAccountProps {
  asset: Asset
}

export class P6LzSraAvmAccounts extends cdk.Resource {
  constructor(scope: Construct, id: string, props: IP6LzSraAvmAccountProps) {
    super(scope, id)

    const accountsFileAsset = new Asset(this, 'AccountFileAsset', {
      path: path.join(__dirname, '..', '..', ACCOUNTS_FILE),
    })

    const accountsFunction = new lambdajs.NodejsFunction(this, 'AccountsMaker', {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.minutes(6),
      tracing: lambda.Tracing.ACTIVE,
      entry: path.join(__dirname, '..', 'resources', 'avm.AccountsMaker.ts'),
      environment: {
        ACCOUNTS_FILE_BUCKET: accountsFileAsset.s3BucketName,
        ACCOUNTS_FILE_KEY: accountsFileAsset.s3ObjectKey,
        OU_FILE_BUCKET: props.asset.s3BucketName,
        OU_FILE_KEY: props.asset.s3ObjectKey,
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
}
