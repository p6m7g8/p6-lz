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

    const cloudTrailBucketArn = `arn:aws:s3:::p6-lz-logarchive-cloudtrail-logs-${props.logarchiveAccountId}-${cdk.Stack.of(this).region}`
    // const configBucketArn = `arn:aws:s3:::p6-lz-logarchive-config-logs-${props.logarchiveAccountId}-${cdk.Stack.of(this).region}`

    const cloudTrailBucket = s3.Bucket.fromBucketArn(this, 'CloudTrailBucket', cloudTrailBucketArn)
    // const configBucket = s3.Bucket.fromBucketArn(this, 'ConfigBucket', configBucketArn)

    // const configRecorderRole = new iam.Role(this, 'ConfigRecorderRole', {
    //   assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
    // })

    // // AWS Config Recorder
    // new config.CfnConfigurationRecorder(this, 'ConfigurationRecorder', {
    //   name: 'default',
    //   roleArn: configRecorderRole.roleArn,
    //   recordingGroup: {
    //     allSupported: true,
    //     includeGlobalResourceTypes: true,
    //   },
    // })

    // // AWS Config Delivery Channel
    // new config.CfnDeliveryChannel(this, 'DeliveryChannel', {
    //   name: 'default',
    //   s3BucketName: configBucket.bucketName,
    //   s3KeyPrefix: `${cdk.Stack.of(this).account}/Config`,
    //   configSnapshotDeliveryProperties: {
    //     deliveryFrequency: 'TwentyFour_Hours',
    //   },
    // })

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
      orgId: props.organizationId,
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
