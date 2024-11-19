import type { Construct } from 'constructs'
import type { AccountAlias, ShareWithOrg } from '../types'
import * as cdk from 'aws-cdk-lib'
import { P6CDKNamer } from 'p6-cdk-namer'

interface NetworkAccountStack1Props extends cdk.StackProps, AccountAlias, ShareWithOrg {}

export class NetworkAccountStack1 extends cdk.Stack {
  constructor(scope: Construct, id: string, props: NetworkAccountStack1Props) {
    super(scope, id, props)

    new P6CDKNamer(this, 'P6CDKNamer', {
      accountAlias: props.accountAlias,
    })
  }
}
