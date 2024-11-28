import type { Construct } from 'constructs'
import type { IP6LzAccountIds } from '../types'
import * as cdk from 'aws-cdk-lib'
import { CloudTrailDelegatedAdmin } from '../constructs/p6-lz-delegators'

interface ManagementAccountCloudTrailStack2Props extends cdk.StackProps, IP6LzAccountIds {}

export class ManagementAccountCloudTrailStack2 extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ManagementAccountCloudTrailStack2Props) {
    super(scope, id, props)

    new CloudTrailDelegatedAdmin(this, 'CloudTrailDelegatedAdmin', props.auditAccountId!)
  }
}
