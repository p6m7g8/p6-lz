import type { Construct } from 'constructs'
import type { IAccountIds } from '../types'
import * as cdk from 'aws-cdk-lib'
import { InspectorDelegatedAdmin } from '../constructs/p6-lz-delegators'

interface ManagementAccountInspectorStack2Props extends cdk.StackProps, IAccountIds {}

export class ManagementAccountInspectorStack2 extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ManagementAccountInspectorStack2Props) {
    super(scope, id, props)

    new InspectorDelegatedAdmin(this, 'InspectorDelegatedAdmin', props.auditAccountId!)
  }
}
