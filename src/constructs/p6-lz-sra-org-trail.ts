import type * as logs from 'aws-cdk-lib/aws-logs'
import type { Construct } from 'constructs'
import type { ILogarchiveBucket } from '../types'
import * as cdk from 'aws-cdk-lib'
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as kms from 'aws-cdk-lib/aws-kms'

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

export interface IP6LzSraOrgTrailProps extends ILogarchiveBucket {
  logGroup: logs.ILogGroup
  logRole: iam.IRole
}

export class P6LzSraOrgTrail extends cdk.Resource {
  constructor(scope: Construct, id: string, props: IP6LzSraOrgTrailProps) {
    super(scope, id)

    const cloudTrailPrinciple = new iam.ServicePrincipal('cloudtrail.amazonaws.com')
    const key = new kms.Key(this, 'Key', {
      alias: 'p6/lz/sra/org-trail',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })
    key.grantEncryptDecrypt(cloudTrailPrinciple)

    const _cfnTrail = new cloudtrail.CfnTrail(this, 'Trail', {
      isLogging: false,
      cloudWatchLogsRoleArn: props.logRole.roleArn,
      cloudWatchLogsLogGroupArn: props.logGroup.logGroupArn,
      enableLogFileValidation: true,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      isOrganizationTrail: true,
      kmsKeyId: key.keyArn,
      s3BucketName: props.centralBucket.bucketName,
    })
    // trail.logAllLambdaDataEvents()
    // trail.logAllS3DataEvents()
  }
}
