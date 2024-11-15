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

    const cloudTrailBucketArn = `arn:aws:s3:::p6-lz-logarchive-cloudtrail-logs-${props.logarchiveAccountId}-${cdk.Stack.of(this).region}`
    const configBucketArn = `arn:aws:s3:::p6-lz-logarchive-config-logs-${props.logarchiveAccountId}-${cdk.Stack.of(this).region}`
    const logBucketKeyArn = `arn:aws:kms:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:key/p6-lz-kms-alias/log-archive-key`

    const cloudTrailBucket = s3.Bucket.fromBucketArn(this, 'CloudTrailBucket', cloudTrailBucketArn)
    const configBucket = s3.Bucket.fromBucketArn(this, 'ConfigBucket', configBucketArn)
    const logBucketKey = kms.Key.fromKeyArn(this, 'LogBucketKey', logBucketKeyArn)

    // IAM Role for AWS Config Recorder
    const configRecorderRole = new iam.Role(this, 'ConfigRecorderRole', {
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWS_ConfigRole'),
      ],
    })

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

    // CloudTrail Trail
    // const trail = new cloudtrail.CfnTrail(this, 'CloudTrail', {
    //   s3BucketName: cloudTrailBucket.bucketName,
    //   isMultiRegionTrail: true,
    //   includeGlobalServiceEvents: true,
    //   enableLogFileValidation: true,
    //   kmsKeyId: logBucketKey.keyArn,
    // })

    // IAM Role for CloudTrail to access the S3 bucket and KMS key
    const cloudTrailRole = new iam.Role(this, 'CloudTrailRole', {
      assumedBy: new iam.ServicePrincipal('cloudtrail.amazonaws.com'),
    })

    cloudTrailBucket.grantWrite(cloudTrailRole)
    logBucketKey.grantEncryptDecrypt(cloudTrailRole)

    // Update the CloudTrail resource to use the IAM role
    // trail.roleArn = cloudTrailRole.roleArn

    // Start the AWS Config Recorder
    new config.CfnDeliveryChannel(this, 'ConfigDeliveryChannel', {
      name: 'default',
      s3BucketName: configBucket.bucketName,
      s3KeyPrefix: `AWSLogs/${cdk.Stack.of(this).account}/Config/`,
    })

    new config.CfnConfigurationRecorder(this, 'ConfigRecorder', {
      name: 'default',
      roleArn: configRecorderRole.roleArn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
      },
    })

    // new config.CfnConfigurationRecorderStatus(this, 'ConfigRecorderStatus', {
    //   name: 'default',
    //   recording: true,
    // })
  }
}
