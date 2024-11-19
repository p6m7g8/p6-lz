import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'

interface NetworkAccountStack2Props extends cdk.StackProps {}

export class NetworkAccountStack2 extends cdk.Stack {
  constructor(scope: Construct, id: string, props: NetworkAccountStack2Props) {
    super(scope, id, props)
  }
}
