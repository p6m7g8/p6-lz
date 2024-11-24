import type { Construct } from 'constructs'
import type { IAccountAlias, IVpc } from '../types'
import * as cdk from 'aws-cdk-lib'
import { P6CDKNamer } from 'p6-cdk-namer'
import { P6LzVpc } from '../constructs/p6-lz-vpc'

interface SandboxAccountStack2Props extends cdk.StackProps, IAccountAlias, IVpc {}

export class SandboxAccountStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SandboxAccountStack2Props) {
    super(scope, id, props)

    new P6CDKNamer(this, 'P6CDKNamer', {
      accountAlias: props.accountAlias,
    })

    new P6LzVpc(this, 'P6LzVpc', {
      cidr: props.cidr,
      myIp: props.myIp,
    })
  }
}
