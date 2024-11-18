import type * as logs from 'aws-cdk-lib/aws-logs'
import type { Construct } from 'constructs'
import type { LogarchiveBucket } from '../types'
import * as cdk from 'aws-cdk-lib'
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as kms from 'aws-cdk-lib/aws-kms'

export interface IP6LzSraOrgTrailProps extends LogarchiveBucket {
  logGroup: logs.ILogGroup
  logRole: iam.IRole
}

export class P6LzSraOrgTrail extends cdk.Resource {
  constructor(scope: Construct, id: string, props: IP6LzSraOrgTrailProps) {
    super(scope, id)

    const key = new kms.Key(this, 'Key', {
      alias: 'p6/lz/sra/org-trail',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })
    const cloudTrailPrinciple = new iam.ServicePrincipal('cloudtrail.amazonaws.com')
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
