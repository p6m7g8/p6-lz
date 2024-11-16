import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'

export class DevAccountStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)
  }
}
