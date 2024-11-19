import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'

interface SharedAccountStack2Props extends cdk.StackProps {}

export class SharedAccountStack2 extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SharedAccountStack2Props) {
    super(scope, id, props)
  }
}
