import type { Construct } from 'constructs'
import type { IP6LzAccountIds } from '../types'
import * as cdk from 'aws-cdk-lib'
import { InspectorDelegatedAdmin } from '../constructs/p6-lz-delegators'

interface ManagementAccountInspectorStack2Props extends cdk.StackProps, IP6LzAccountIds {}

export class ManagementAccountInspectorStack2 extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ManagementAccountInspectorStack2Props) {
    super(scope, id, props)

    new InspectorDelegatedAdmin(this, 'InspectorDelegatedAdmin', props.auditAccountId!)
  }
}
