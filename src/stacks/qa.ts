import type { Construct } from 'constructs'
import type { AccountAlias } from '../types'
import * as cdk from 'aws-cdk-lib'
import { P6CDKNamer } from 'p6-cdk-namer'

interface QaAccountStack2Props extends cdk.StackProps, AccountAlias {}

export class QaAccountStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: QaAccountStack2Props) {
    super(scope, id, props)

    new P6CDKNamer(this, 'P6CDKNamer', {
      accountAlias: props.accountAlias,
    })
  }
}
