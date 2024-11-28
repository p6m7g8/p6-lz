import type { Construct } from 'constructs'
import type { IP6LzAccountAlias, IP6LzShareWithOrg } from '../types'
import * as cdk from 'aws-cdk-lib'
import { P6CDKNamer } from 'p6-cdk-namer'
import { P6LzSraCloudWatch } from '../constructs/p6-lz-sra-cloudwatch'
import { P6LzSraOrgTrail } from '../constructs/p6-lz-sra-org-trail'
import { getCentralBucket } from '../util'

interface AuditAccountStack1Props extends cdk.StackProps, IP6LzAccountAlias, IP6LzShareWithOrg {}

export class AuditAccountStack1 extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AuditAccountStack1Props) {
    super(scope, id, props)

    const bucket = getCentralBucket(this)

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
