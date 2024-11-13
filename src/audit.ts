import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail'
import * as config from 'aws-cdk-lib/aws-config'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as kms from 'aws-cdk-lib/aws-kms'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as s3 from 'aws-cdk-lib/aws-s3'

export class AuditAccountStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const logarchiveAccountId = this.node.tryGetContext('logarchiveAccountId')
    const organizationId = this.node.tryGetContext('organizationId')

    const cloudTrailBucketArn = `arn:aws:s3:::p6-lz-logarchive-cloudtrail-logs-${logarchiveAccountId}-${cdk.Stack.of(this).region}`
    const configBucketArn = `arn:aws:s3:::p6-lz-logarchive-config-logs-${logarchiveAccountId}-${cdk.Stack.of(this).region}`
    const logBucketKeyArn = `arn:aws:kms:${cdk.Stack.of(this).region}:${logarchiveAccountId}:key/p6-lz-kms-alias/log-archive-key`

    // Reference the S3 buckets and KMS key
    const cloudTrailBucket = s3.Bucket.fromBucketArn(this, 'CloudTrailBucket', cloudTrailBucketArn)
    const configBucket = s3.Bucket.fromBucketArn(this, 'ConfigBucket', configBucketArn)
    const logBucketKey = kms.Key.fromKeyArn(this, 'LogBucketKey', logBucketKeyArn)

    // IAM Role for AWS Config Recorder
    const configRecorderRole = iam.Role.fromRoleArn(this, 'ConfigRecorderRole', `arn:aws:iam::${cdk.Stack.of(this).account}:role/aws-service-role/config.amazonaws.com/AWSServiceRoleForConfig`)

    // Grant permissions to use the KMS key
    logBucketKey.grantEncryptDecrypt(configRecorderRole)

    // AWS Config Recorder
    new config.CfnConfigurationRecorder(this, 'ConfigurationRecorder', {
      name: 'default',
      roleArn: configRecorderRole.roleArn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
      },
    })

    // AWS Config Delivery Channel
    new config.CfnDeliveryChannel(this, 'DeliveryChannel', {
      name: 'default',
      s3BucketName: configBucket.bucketName,
      s3KeyPrefix: `AWSLogs/${cdk.Stack.of(this).account}/Config/`,
      configSnapshotDeliveryProperties: {
        deliveryFrequency: 'TwentyFour_Hours',
      },
    })

    const cloudTrailEncryptionKey = new kms.Key(this, 'CloudTrailEncryptionKey', {
      alias: 'p6/lz/kms/alias/cloudtrail-key',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    // CloudTrail Trail
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
      orgId: organizationId,
    })

    // Enable Security Hub
    // new securityhub.CfnHub(this, 'SecurityHub', {})

    // Enable GuardDuty
    // new guardduty.CfnDetector(this, 'GuardDutyDetector', {
    //   enable: true,
    // })

    // Enable Macie
    // new macie.CfnSession(this, 'MacieSession', {
    //   status: 'ENABLED',
    //   findingPublishingFrequency: 'FIFTEEN_MINUTES',
    // })
  }
}
