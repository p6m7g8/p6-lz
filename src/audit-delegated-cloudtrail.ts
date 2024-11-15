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

export class AuditDelegatedCloudTrailAccountStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AuditAccountStackProps) {
    super(scope, id, props)

    const cloudTrailBucketArn = `arn:aws:s3:::p6-lz-logarchive-cloudtrail-logs-${props.logarchiveAccountId}-${cdk.Stack.of(this).region}`
    const cloudTrailBucket = s3.Bucket.fromBucketArn(this, 'CloudTrailBucket', cloudTrailBucketArn)
    const cloudTrailEncryptionKey = new kms.Key(this, 'CloudTrailEncryptionKey', {
      alias: 'p6/lz/kms/alias/cloudtrail-key',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    new cloudtrail.Trail(this, 'OrganizationTrail', {
      isMultiRegionTrail: true,
      isOrganizationTrail: true,
      includeGlobalServiceEvents: true,
      managementEvents: cloudtrail.ReadWriteType.ALL,
      enableFileValidation: true,
      sendToCloudWatchLogs: true,
      cloudWatchLogsRetention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: cloudTrailEncryptionKey,
      bucket: cloudTrailBucket,
      orgId: props.organizationId,
    })
  }
}
