import type { Construct } from 'constructs'
import type { IAccountAlias, ILogarchiveBucketArn, IShareWithOrg } from '../types'
import * as cdk from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { P6CDKNamer } from 'p6-cdk-namer'
import { P6LzSraCloudWatch } from '../constructs/p6-lz-sra-cloudwatch'
import { P6LzSraOrgTrail } from '../constructs/p6-lz-sra-org-trail'

interface AuditAccountStack1Props extends cdk.StackProps, IAccountAlias, IShareWithOrg, ILogarchiveBucketArn {}

export class AuditAccountStack1 extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AuditAccountStack1Props) {
    super(scope, id, props)

    const bucket = s3.Bucket.fromBucketArn(this, 'CentralBucket', props.centralBucketArn.toString())

    new P6CDKNamer(this, 'P6CDKNamer', {
      accountAlias: props.accountAlias,
    })

    const cw = new P6LzSraCloudWatch(this, 'P6LzSraCloudWatch', {
      accountAlias: props.accountAlias,
    })

    const trail = new P6LzSraOrgTrail(this, 'P6LzSraOrgTrail', {
      logGroup: cw.logGroup,
      logRole: cw.logRole,
      centralBucket: bucket,
    })
    trail.node.addDependency(cw)
  }
}
