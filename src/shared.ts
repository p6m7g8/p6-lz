// lib/shared-account-stack.ts

import type { StackProps } from 'aws-cdk-lib'
import type { Construct } from 'constructs'
import {
  Aws,
  aws_cloudtrail as cloudtrail,
  aws_config as config,
  aws_iam as iam,
  aws_kms as kms,
  aws_s3 as s3,
  aws_ssm as ssm,
  Stack,
} from 'aws-cdk-lib'

export class SharedAccountStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    // Import Bucket ARNs and KMS Key ARN from SSM Parameter Store
    const cloudTrailBucketArn = ssm.StringParameter.valueForStringParameter(
      this,
      '/log-archive/cloudtrail-bucket-arn',
    )

    const configBucketArn = ssm.StringParameter.valueForStringParameter(
      this,
      '/log-archive/config-bucket-arn',
    )

    const logBucketKeyArn = ssm.StringParameter.valueForStringParameter(
      this,
      '/log-archive/kms-key-arn',
    )

    // Reference the S3 buckets and KMS key
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
      s3KeyPrefix: `AWSLogs/${Aws.ACCOUNT_ID}/Config/`,
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
      s3KeyPrefix: `AWSLogs/${Aws.ACCOUNT_ID}/Config/`,
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
