import type { IPrincipal } from 'aws-cdk-lib/aws-iam'
import type { Construct } from 'constructs'
import type { IP6LzShareWithOrg } from '../types'
import * as cdk from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as kms from 'aws-cdk-lib/aws-kms'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { getCentralBucketName } from '../util'

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

export interface IP6LzSraCentralBucketProps extends IP6LzShareWithOrg {}

export class P6LzSraCentralBucket extends cdk.Resource {
  constructor(scope: Construct, id: string, props: IP6LzSraCentralBucketProps) {
    super(scope, id)

    const key = new kms.Key(this, 'Key', {
      alias: 'p6/lz/sra/central-bucket',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    const bucket = new s3.Bucket(this, 'Bucket', {
      bucketName: getCentralBucketName(this),
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: key,
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

    const cloudTrailPrinciple = new iam.ServicePrincipal('cloudtrail.amazonaws.com')
    const configPrinciple = new iam.ServicePrincipal('config.amazonaws.com')
    bucket.addToResourcePolicy(new iam.PolicyStatement({
      resources: [bucket.bucketArn],
      actions: ['s3:GetBucketAcl'],
      principals: [cloudTrailPrinciple, configPrinciple],
    }))
    const principals: IPrincipal[] = props.principals.map(principal => new iam.AccountPrincipal(principal))
    bucket.addToResourcePolicy(new iam.PolicyStatement({
      resources: [bucket.bucketArn],
      actions: ['s3:GetBucketAcl'],
      principals,
    }))

    bucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:PutObject'],
      principals,
      resources: [bucket.arnForObjects('*')],
      conditions: {
        StringEquals:
                {
                  's3:x-amz-acl': 'bucket-owner-full-control',
                },
      },
    }))
    bucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:PutObject'],
      principals: [cloudTrailPrinciple, configPrinciple],
      resources: [bucket.arnForObjects('*')],
      conditions: {
        StringEquals:
                {
                  's3:x-amz-acl': 'bucket-owner-full-control',
                },
      },
    }))
  }
}
