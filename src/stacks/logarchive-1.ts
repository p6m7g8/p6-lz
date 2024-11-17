import type { Construct } from 'constructs'
import type { AccountAlias, AccountIds } from '../types'
import * as cdk from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'
import { P6CDKNamer } from 'p6-cdk-namer'
import { P6LzSraCentralBucket } from '../constructs/p6-lz-sra-central-bucket'

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

interface LogarchiveAccountStackProps extends cdk.StackProps, AccountIds, AccountAlias {}

export class LogarchiveAccountStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LogarchiveAccountStackProps) {
    super(scope, id, props)

    new P6CDKNamer(this, 'P6LzCdkNamer', {
      accountAlias: props.accountAlias,
    })
    new P6LzSraCentralBucket(this, 'P6LzSraCentralBucket', {
      principals: [
        new iam.ServicePrincipal(props.auditAccountId),
        new iam.ServicePrincipal(props.devAccountId),
        new iam.ServicePrincipal(props.logarchiveAccountId),
        new iam.ServicePrincipal(props.managementAccountId),
        new iam.ServicePrincipal(props.networkAccountId),
        new iam.ServicePrincipal(props.prodAccountId),
        new iam.ServicePrincipal(props.qaAccountId),
        new iam.ServicePrincipal(props.sandboxAccountId),
        new iam.ServicePrincipal(props.sharedAccountId),
      ],
    })
  }
}

// private setupCloudWatch() {
//   const cloudTrailPrincipal = new iam.ServicePrincipal('cloudtrail.amazonaws.com')
//   const logsPrinciple = new iam.ServicePrincipal('logs.amazonaws.com')

//   const cwLogKey = new kms.Key(this, 'CWLogKey', {
//     alias: 'p6/lz/CWLogKey',
//     enableKeyRotation: true,
//     removalPolicy: cdk.RemovalPolicy.DESTROY,
//   })

//   cwLogKey.grantEncryptDecrypt(logsPrinciple)

//   const logGroup = new logs.LogGroup(this, 'LogGroup', {
//     logGroupName: '/p6/lz/logarchive',
//     removalPolicy: cdk.RemovalPolicy.DESTROY,
//     retention: logs.RetentionDays.FOUR_MONTHS,
//     encryptionKey: cwLogKey,
//   })

//   const logRole = new iam.Role(this, 'LogsRole', { assumedBy: cloudTrailPrincipal })
//   logRole.addToPrincipalPolicy(new iam.PolicyStatement({
//     actions: [
//       'logs:PutLogEvents',
//       'logs:CreateLogStream',
//     ],
//     resources: [logGroup.logGroupArn],
//   }))

//   return { logGroup, logRole }
// }

// private setupCloudTrail(logGroup: logs.LogGroup, logRole: iam.Role) {
//   const cloudTrailPrincipal = new iam.ServicePrincipal('cloudtrail.amazonaws.com')

//   const trailKey = new kms.Key(this, 'CloudTrailKey', {
//     alias: 'p6/lz/CloudTrailKey',
//     enableKeyRotation: true,
//     removalPolicy: cdk.RemovalPolicy.DESTROY,
//   })
//   trailKey.grantEncryptDecrypt(cloudTrailPrincipal)

//   const bucket = new s3.Bucket(this, 'OrganizationTrailBucket', {
//     autoDeleteObjects: true,
//     blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
//     encryption: s3.BucketEncryption.KMS,
//     encryptionKey: trailKey,
//     enforceSSL: true,
//     intelligentTieringConfigurations: [
//       {
//         name: 'p6-lz-s3-it-std',
//         archiveAccessTierTime: cdk.Duration.days(90),
//         deepArchiveAccessTierTime: cdk.Duration.days(180),
//       },
//     ],
//     publicReadAccess: false,
//     removalPolicy: cdk.RemovalPolicy.DESTROY,
//     versioned: true,
//   })

//   bucket.addToResourcePolicy(new iam.PolicyStatement({
//     resources: [bucket.bucketArn],
//     actions: ['s3:GetBucketAcl'],
//     principals: [cloudTrailPrincipal],
//   }))

//   bucket.addToResourcePolicy(new iam.PolicyStatement({
//     actions: ['s3:PutObject'],
//     principals: [cloudTrailPrincipal],
//     resources: [bucket.arnForObjects('*')],
//     conditions: {
//       StringEquals:
//               {
//                 's3:x-amz-acl': 'bucket-owner-full-control',
//               },
//     },
//   }))

//   const trail = new cloudtrail.CfnTrail(this, 'Trail', {
//     cloudWatchLogsLogGroupArn: logGroup.logGroupArn,
//     cloudWatchLogsRoleArn: logRole.roleArn,
//     enableLogFileValidation: true,
//     includeGlobalServiceEvents: true,
//     isLogging: false,
//     isMultiRegionTrail: true,
//     isOrganizationTrail: true,
//     kmsKeyId: trailKey.keyArn,
//     s3BucketName: bucket.bucketName,
//   })
//   trail.node.addDependency(bucket)
//   trail.node.addDependency(logGroup)
// }

// private setupConfig(auditAccountId: string) {
//   const auditAccountPrincipal = new iam.AccountPrincipal(auditAccountId)
//   const configPrincipal = new iam.ServicePrincipal('config.amazonaws.com')

//   const configKey = new kms.Key(this, 'ConfigKey', {
//     alias: 'p6/lz/ConfigKey',
//     enableKeyRotation: true,
//     removalPolicy: cdk.RemovalPolicy.DESTROY,
//   })
//   configKey.addToResourcePolicy(
//     new iam.PolicyStatement({
//       principals: [auditAccountPrincipal],
//       actions: [
//         'kms:Encrypt',
//         'kms:Decrypt',
//         'kms:ReEncrypt*',
//         'kms:GenerateDataKey*',
//         'kms:DescribeKey',
//       ],
//       resources: ['*'],
//     }),
//   )

//   const configBucket = new s3.Bucket(this, 'ConfigBucket', {
//     blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
//     publicReadAccess: false,
//     versioned: true,
//     removalPolicy: cdk.RemovalPolicy.DESTROY,
//     autoDeleteObjects: true,
//     encryption: s3.BucketEncryption.KMS,
//     encryptionKey: configKey,
//     intelligentTieringConfigurations: [
//       {
//         name: 'p6-lz-s3-it-std',
//         archiveAccessTierTime: cdk.Duration.days(90),
//         deepArchiveAccessTierTime: cdk.Duration.days(180),
//       },
//     ],
//   })

//   configBucket.addToResourcePolicy(
//     new iam.PolicyStatement({
//       principals: [configPrincipal, auditAccountPrincipal],
//       resources: [configBucket.bucketArn],
//       actions: ['s3:GetBucketAcl'],
//     }),
//   )

//   configBucket.addToResourcePolicy(
//     new iam.PolicyStatement({
//       principals: [configPrincipal, auditAccountPrincipal],
//       resources: [`${configBucket.bucketArn}/*`],
//       actions: ['s3:PutObject'],
//       conditions: {
//         StringEquals: {
//           's3:x-amz-acl': 'bucket-owner-full-control',
//         },
//       },
//     }),
//   )

//   const configRole = new iam.Role(this, 'RoleAwsConfig', {
//     assumedBy: configPrincipal,
//     managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWS_ConfigRole')],
//   })

//   new config.CfnDeliveryChannel(this, 'DeliveryChannel', {
//     s3BucketName: configBucket.bucketName,
//     configSnapshotDeliveryProperties: {
//       deliveryFrequency: 'One_Hour',
//     },
//   })

//   new config.CfnConfigurationRecorder(this, 'Recorder', {
//     roleArn: configRole.roleArn,
//     recordingGroup: {
//       allSupported: true,
//       includeGlobalResourceTypes: true,
//     },
//   })
//   }
// }
