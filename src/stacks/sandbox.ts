import type { Construct } from 'constructs'
import type { AccountAlias } from '../types'
import * as cdk from 'aws-cdk-lib'
import { P6CDKNamer } from 'p6-cdk-namer'

interface SandboxAccountStack2Props extends cdk.StackProps, AccountAlias {}

export class SandboxAccountStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SandboxAccountStack2Props) {
    super(scope, id, props)

    new P6CDKNamer(this, 'P6CDKNamer', {
      accountAlias: props.accountAlias,
    })
  }
}
