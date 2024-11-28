import type { Construct } from 'constructs'
import type { IP6LzAccountAlias, IP6LzShareWithOrg } from '../types'
import * as cdk from 'aws-cdk-lib'
import { P6CDKNamer } from 'p6-cdk-namer'

interface SharedAccountStack1Props extends cdk.StackProps, IP6LzAccountAlias, IP6LzShareWithOrg {}

export class SharedAccountStack1 extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SharedAccountStack1Props) {
    super(scope, id, props)

    new P6CDKNamer(this, 'P6CDKNamer', {
      accountAlias: props.accountAlias,
    })
  }
}
