import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail'
import * as config from 'aws-cdk-lib/aws-config'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as kms from 'aws-cdk-lib/aws-kms'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { P6CDKNamer } from 'p6-cdk-namer'

/**
 * XXX: Danger! CloudFormation CloudTrail support is a literal piece of shit.
 * XXX: You can not set isLogging: true when making an isOrganizationTrail: true
 * XXX: The logging enable will fail b/c it thinks the trail doesn't exist yet
 * XXX: The aws cdk cloudtrail.Trail resource does not provide a way to not set isLogging: true
 *
 * This forces us to drop to the L1 CfnTrail Resource *sigh*
 *
 * XXX: The s3 bucket policy does not work when following the docs nor for what is in the AWS CDK cloudtrail.Trail
 * XXX: which are sadly different!
 * XXX: Since this bucket is only used for cloudtrail we can hack around it by granting ALL objects in the bucket
 *
 * Hence the `resources: [bucket.arnForObjects('*')]` for s3:PutObject
 *
 * XXX: Despite the docs explaining sns:Publish (CDK) or SNS:Publish (AWS Docs) neither works
 * XXX: whether you do it via topic.grantPublish(trail) or via iam Policy attach
 *
 * There seems to be now solution here
 *
 * XXX: Its simpler to write a post cdk deploy 1-liner than a [aws] custom resource to start logging
 *
 */

/**
 * LogarchiveAccountStack
 * @class
 * @classdesc
 * @extends cdk.Stack
 * @constructs
 * @param {Construct} scope - cdk.Construct
 * @param {string} id - 'LogarchiveAccountStack'
 * @param {cdk.StackProps} props - cdk.StackProps
 */
export class LogarchiveAccountStack extends cdk.Stack {
  /**
   *
   * @param scope - cdk.Construct
   * @param id - 'LogarchiveAccountStack'
   * @param props - cdk.StackProps
   */
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props)

    new P6CDKNamer(this, 'P6CDKNamer', {
      accountAlias: 'p6m7g8-logarchive',
    })

    const cloudTrailPrincipal = new iam.ServicePrincipal('cloudtrail.amazonaws.com')
    const logsPrinciple = new iam.ServicePrincipal('logs.amazonaws.com')

    // ---------------------------------------- CW Logs
    const cwLogKey = new kms.Key(this, 'CWLogKey', {
      alias: 'p6/lz/CWLogKey',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    cwLogKey.grantEncryptDecrypt(logsPrinciple)

    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: '/p6/lz/logarchive',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.FOUR_MONTHS,
      encryptionKey: cwLogKey,
    })

    const logsRole = new iam.Role(this, 'LogsRole', { assumedBy: cloudTrailPrincipal })
    logsRole.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: ['logs:PutLogEvents', 'logs:CreateLogStream'],
      resources: [logGroup.logGroupArn],
    }))

    // ---------------------------------------- Trail
    const trailKey = new kms.Key(this, 'CloudTrailKey', {
      alias: 'p6/lz/CloudTrailKey',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })
    trailKey.grantEncryptDecrypt(cloudTrailPrincipal)

    const bucket = new s3.Bucket(this, 'OrganizationTrailBucket', {
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: trailKey,
      enforceSSL: true,
      intelligentTieringConfigurations: [
        {
          name: 'p6-lz-s3-it-std',
          archiveAccessTierTime: cdk.Duration.days(90),
          deepArchiveAccessTierTime: cdk.Duration.days(180),
        },
      ],
      publicReadAccess: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      versioned: true,
    })

    bucket.addToResourcePolicy(new iam.PolicyStatement({
      resources: [bucket.bucketArn],
      actions: ['s3:GetBucketAcl'],
      principals: [cloudTrailPrincipal],
    }))

    bucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:PutObject'],
      principals: [cloudTrailPrincipal],
      resources: [bucket.arnForObjects('*')],
      conditions: {
        StringEquals:
                {
                  's3:x-amz-acl': 'bucket-owner-full-control',
                },
      },
    }))

    const trail = new cloudtrail.CfnTrail(this, 'Trail', {
      cloudWatchLogsLogGroupArn: logGroup.logGroupArn,
      cloudWatchLogsRoleArn: logsRole.roleArn,
      enableLogFileValidation: true,
      includeGlobalServiceEvents: true,
      isLogging: false,
      isMultiRegionTrail: true,
      isOrganizationTrail: true,
      kmsKeyId: trailKey.keyArn,
      s3BucketName: bucket.bucketName,
    })
    trail.node.addDependency(bucket)
    trail.node.addDependency(logGroup)

    // ---------------------------------------- Config
    const configKey = new kms.Key(this, 'ConfigKey', {
      alias: 'p6/lz/ConfigKey',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    const configBucket = new s3.Bucket(this, 'ConfigBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: configKey,
      intelligentTieringConfigurations: [
        {
          name: 'p6-lz-s3-it-std',
          archiveAccessTierTime: cdk.Duration.days(90),
          deepArchiveAccessTierTime: cdk.Duration.days(180),
        },
      ],
    })

    configBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('config.amazonaws.com')],
        resources: [configBucket.bucketArn],
        actions: ['s3:GetBucketAcl'],
      }),
    )

    configBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('config.amazonaws.com')],
        resources: [`${configBucket.bucketArn}/*`],
        actions: ['s3:PutObject'],
        conditions: {
          StringEquals: {
            's3:x-amz-acl': 'bucket-owner-full-control',
          },
        },
      }),
    )

    const configRole = new iam.Role(this, 'RoleAwsConfig', {
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWS_ConfigRole')],
    })

    new config.CfnDeliveryChannel(this, 'DeliveryChannel', {
      s3BucketName: configBucket.bucketName,
      configSnapshotDeliveryProperties: {
        deliveryFrequency: 'One_Hour',
      },
    })

    new config.CfnConfigurationRecorder(this, 'Recorder', {
      roleArn: configRole.roleArn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
      },
    })
  }
}
