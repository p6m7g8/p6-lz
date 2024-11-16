import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail'
// import * as config from 'aws-cdk-lib/aws-config'
import * as iam from 'aws-cdk-lib/aws-iam'
// import * as kms from 'aws-cdk-lib/aws-kms'
// import * as logs from 'aws-cdk-lib/aws-logs'
import * as s3 from 'aws-cdk-lib/aws-s3'

interface AuditAccountStackProps extends cdk.StackProps {
  organizationId: string
  logarchiveAccountId: string
}

export class AuditAccountStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AuditAccountStackProps) {
    super(scope, id, props)

    const orgTrailBucket = new s3.Bucket(this, 'OrganizationTrailBucket', { blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL })

    orgTrailBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetBucketAcl'],
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
      resources: [orgTrailBucket.bucketArn],
    }))

    orgTrailBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:PutObject'],
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
      resources: [`${orgTrailBucket.bucketArn}/AWSLogs/${props.organizationId}/*`],
      conditions: {
        StringEquals:
                {
                  's3:x-amz-acl': 'bucket-owner-full-control',
                },
      },
    }))

    orgTrailBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:PutObject'],
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
      resources: [`${orgTrailBucket.bucketArn}/AWSLogs/*/*`],
      conditions: {
        StringEquals:
                {
                  's3:x-amz-acl': 'bucket-owner-full-control',
                },
      },
    }))

    // Create a CloudTrail trail
    new cloudtrail.Trail(this, 'CloudTrail', {
      bucket: orgTrailBucket,
      // sendToCloudWatchLogs: true,
      // enableFileValidation: true,
      // isOrganizationTrail: true,
      // orgId: props.organizationId,
    })
  }
}
