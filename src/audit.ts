import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail'
// import * as config from 'aws-cdk-lib/aws-config'
// import * as iam from 'aws-cdk-lib/aws-iam'
import * as kms from 'aws-cdk-lib/aws-kms'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as s3 from 'aws-cdk-lib/aws-s3'

interface AuditAccountStackProps extends cdk.StackProps {
  organizationId: string
  logarchiveAccountId: string
}

export class AuditAccountStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AuditAccountStackProps) {
    super(scope, id, props)
  }
}
