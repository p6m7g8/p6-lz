// lib/log-archive-account-stack.ts

import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'
// import * as kms from 'aws-cdk-lib/aws-kms'
import * as s3 from 'aws-cdk-lib/aws-s3'

interface LogarchiveAccountStackProps extends cdk.StackProps {
  organizationId: string
}

export class LogarchiveAccountStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LogarchiveAccountStackProps) {
    super(scope, id, props)
  }
}
