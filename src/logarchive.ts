// lib/log-archive-account-stack.ts

import type { StackProps } from 'aws-cdk-lib'
import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import { Aws, aws_iam as iam, aws_kms as kms, RemovalPolicy, aws_s3 as s3, aws_ssm as ssm, Stack } from 'aws-cdk-lib'

export class LogarchiveAccountStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const organizationId = ssm.StringParameter.valueForStringParameter(
      this,
      '/organization/id',
    )
    // KMS Key for S3 Bucket Encryption
    const logBucketKey = new kms.Key(this, 'LogBucketKey', {
      alias: 'alias/log-archive-key',
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    // Allow Organization Accounts to use the KMS Key
    logBucketKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Allow Organization to use the encryption key',
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        actions: [
          'kms:Decrypt',
          'kms:Encrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:DescribeKey',
        ],
        conditions: {
          StringEquals: {
            'aws:PrincipalOrgID': organizationId,
          },
        },
      }),
    )

    // S3 Bucket for CloudTrail Logs
    const cloudTrailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
      bucketName: `log-archive-cloudtrail-logs-${Aws.ACCOUNT_ID}-${Aws.REGION}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: logBucketKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          enabled: true,
          expiration: cdk.Duration.days(2555), // 7 years
        },
      ],
      removalPolicy: RemovalPolicy.DESTROY,
    })

    // S3 Bucket for Config Logs
    const configBucket = new s3.Bucket(this, 'ConfigBucket', {
      bucketName: `log-archive-config-logs-${Aws.ACCOUNT_ID}-${Aws.REGION}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: logBucketKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      enforceSSL: true,
      lifecycleRules: [
        {
          enabled: true,
          expiration: cdk.Duration.days(2555),
        },
      ],
    })

    // Bucket Policy for CloudTrail Bucket
    cloudTrailBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Allow Organization to put objects',
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${cloudTrailBucket.bucketArn}/AWSLogs/*/*`],
        conditions: {
          StringEquals: {
            'aws:PrincipalOrgID': organizationId,
            's3:x-amz-acl': 'bucket-owner-full-control',
          },
        },
      }),
    )

    // Bucket Policy for Config Bucket
    configBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Allow Organization to put objects',
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${configBucket.bucketArn}/AWSLogs/*/*`],
        conditions: {
          StringEquals: {
            'aws:PrincipalOrgID': organizationId,
            's3:x-amz-acl': 'bucket-owner-full-control',
          },
        },
      }),
    )

    // Export Bucket ARNs and KMS Key ARN via SSM Parameter Store
    new ssm.StringParameter(this, 'CloudTrailBucketArnParameter', {
      parameterName: '/log-archive/cloudtrail-bucket-arn',
      stringValue: cloudTrailBucket.bucketArn,
      description: 'CloudTrail Bucket ARN for cross-account access',
      tier: ssm.ParameterTier.STANDARD,
    })

    new ssm.StringParameter(this, 'ConfigBucketArnParameter', {
      parameterName: '/log-archive/config-bucket-arn',
      stringValue: configBucket.bucketArn,
      description: 'Config Bucket ARN for cross-account access',
      tier: ssm.ParameterTier.STANDARD,
    })

    new ssm.StringParameter(this, 'LogBucketKeyArnParameter', {
      parameterName: '/log-archive/kms-key-arn',
      stringValue: logBucketKey.keyArn,
      description: 'KMS Key ARN for cross-account access',
      tier: ssm.ParameterTier.STANDARD,
    })
  }
}
