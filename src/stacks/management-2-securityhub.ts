import type { Construct } from 'constructs'
import type { IP6LzAccountIds } from '../types'
import * as cdk from 'aws-cdk-lib'
import { SecurityHubDelegatedAdmin } from '../constructs/p6-lz-delegators'

interface ManagementAccountSecurityHubStack2Props extends cdk.StackProps, IP6LzAccountIds {}

export class ManagementAccountSecurityHubStack2 extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ManagementAccountSecurityHubStack2Props) {
    super(scope, id, props)

    new SecurityHubDelegatedAdmin(this, 'SecurityHubDelegatedAdmin', props.auditAccountId!)
  }
}
