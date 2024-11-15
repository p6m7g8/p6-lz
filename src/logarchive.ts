// lib/log-archive-account-stack.ts

import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as kms from 'aws-cdk-lib/aws-kms'
import * as s3 from 'aws-cdk-lib/aws-s3'

interface LogarchiveAccountStackProps extends cdk.StackProps {
  organizationId: string
}

export class LogarchiveAccountStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LogarchiveAccountStackProps) {
    super(scope, id, props)

    // KMS Key for S3 Bucket Encryption
    const logBucketKey = new kms.Key(this, 'LogBucketKey', {
      alias: 'p6/lz/kms/alias/log-archive-key',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
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
            'aws:PrincipalOrgID': props.organizationId,
          },
        },
      }),
    )

    // S3 Bucket for CloudTrail Logs
    const cloudTrailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
      bucketName: `p6-lz-logarchive-cloudtrail-logs-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: logBucketKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30), // Transition to IA after 30 days
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(365), // Transition to Glacier after 365 days
            },
          ],
          expiration: cdk.Duration.days(365 * 7), // Expire after 7 years
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    // Policy allowing only the local account to modify the CloudTrail bucket policy
    cloudTrailBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowAccountAccess',
        effect: iam.Effect.ALLOW,
        principals: [new iam.AccountRootPrincipal()],
        actions: ['s3:*'],
        resources: [cloudTrailBucket.bucketArn, `${cloudTrailBucket.bucketArn}/*`],
      }),
    )

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
            'aws:PrincipalOrgID': props.organizationId,
            's3:x-amz-acl': 'bucket-owner-full-control',
          },
        },
      }),
    )

    // S3 Bucket for Config Logs
    const configBucket = new s3.Bucket(this, 'ConfigBucket', {
      bucketName: `p6-lz-logarchive-config-logs-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: logBucketKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      enforceSSL: true,
      lifecycleRules: [
        {
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30), // Transition to IA after 30 days
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(365), // Transition to Glacier after 365 days
            },
          ],
          expiration: cdk.Duration.days(365 * 7), // Expire after 7 years
        },
      ],
    })

    // Policy allowing only the local account to modify the Config bucket policy
    configBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Allow Local Account to Modify Bucket Policy',
        effect: iam.Effect.ALLOW,
        principals: [new iam.AccountRootPrincipal()],
        actions: ['s3:PutBucketPolicy'],
        resources: [configBucket.bucketArn],
      }),
    )

    // Bucket Policy for Config Bucket
    configBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Allow Organization to put objects',
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${configBucket.bucketArn}/${cdk.Stack.of(this).account}/Config`],
        conditions: {
          StringEquals: {
            'aws:PrincipalOrgID': props.organizationId,
            's3:x-amz-acl': 'bucket-owner-full-control',
          },
        },
      }),
    )
  }
}
