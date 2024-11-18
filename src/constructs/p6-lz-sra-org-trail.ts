import type * as iam from 'aws-cdk-lib/aws-iam'
import type * as logs from 'aws-cdk-lib/aws-logs'
import type { Construct } from 'constructs'
import type { LogarchiveBucket } from '../types'
import * as cdk from 'aws-cdk-lib'
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail'
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

    const _trail = new cloudtrail.CfnTrail(this, 'Trail', {
      cloudWatchLogsLogGroupArn: props.logGroup.logGroupArn,
      cloudWatchLogsRoleArn: props.logRole.roleArn,
      enableLogFileValidation: true,
      includeGlobalServiceEvents: true,
      isLogging: false,
      isMultiRegionTrail: true,
      isOrganizationTrail: true,
      kmsKeyId: key.keyArn,
      s3BucketName: props.centralBucket.bucketName,
    })
  }
}
