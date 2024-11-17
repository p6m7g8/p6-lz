import type { Asset } from 'aws-cdk-lib/aws-s3-assets'
import type { Construct } from 'constructs'
import * as path from 'node:path'
import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdajs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as cr from 'aws-cdk-lib/custom-resources'
import * as floyd from 'cdk-iam-floyd'

export interface IP6LzSraAvmOuProps {
  asset: Asset
}

export class P6LzSraAvmOus extends cdk.Resource {
  constructor(scope: Construct, id: string, props: IP6LzSraAvmOuProps) {
    super(scope, id)
    const ouFunction = new lambdajs.NodejsFunction(this, 'OUMaker', {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.minutes(1),
      tracing: lambda.Tracing.ACTIVE,
      entry: path.join(__dirname, '..', 'resources', 'avm.OUMaker.ts'),
      environment: {
        OU_FILE_BUCKET: props.asset.s3BucketName,
        OU_FILE_KEY: props.asset.s3ObjectKey,
      },
      bundling: {
        nodeModules: ['aws-sdk', 'aws-lambda', 'js-yaml', 'winston'],
      },
    })
    props.asset.grantRead(ouFunction)
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
