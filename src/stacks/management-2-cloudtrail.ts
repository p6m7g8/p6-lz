import type { Construct } from 'constructs'
import type { IAccountIds } from '../types'
import * as cdk from 'aws-cdk-lib'
import { CloudTrailDelegatedAdmin } from '../constructs/p6-lz-delegators'

interface ManagementAccountCloudTrailStack2Props extends cdk.StackProps, IAccountIds {}

export class ManagementAccountCloudTrailStack2 extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ManagementAccountCloudTrailStack2Props) {
    super(scope, id, props)

    new CloudTrailDelegatedAdmin(this, 'CloudTrailDelegatedAdmin', props.auditAccountId!)
  }
}
