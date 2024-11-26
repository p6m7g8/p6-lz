import type { Construct } from 'constructs'
import type { IAccountIds } from '../types'
import * as cdk from 'aws-cdk-lib'
import { ConfigDelegatedAdmin } from '../constructs/p6-lz-delegators'

interface ManagementAccountConfigStack2Props extends cdk.StackProps, IAccountIds {}

export class ManagementAccountConfigStack2 extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ManagementAccountConfigStack2Props) {
    super(scope, id, props)

    new ConfigDelegatedAdmin(this, 'ConfigDelegatedAdmin', props.auditAccountId!)
  }
}
