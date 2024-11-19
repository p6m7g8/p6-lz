import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'

interface ManagementAccountStack3Props extends cdk.StackProps {}

export class ManagementAccountStack3 extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ManagementAccountStack3Props) {
    super(scope, id, props)
  }
}
