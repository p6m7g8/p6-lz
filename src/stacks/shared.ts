import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as config from 'aws-cdk-lib/aws-config'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as kms from 'aws-cdk-lib/aws-kms'
import * as s3 from 'aws-cdk-lib/aws-s3'

interface SharedAccountStackProps extends cdk.StackProps {
  logarchiveAccountId: string
}

export class SharedAccountStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SharedAccountStackProps) {
    super(scope, id, props)
  }
}
