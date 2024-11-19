import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'

interface LogarchiveAccountStack2Props extends cdk.StackProps {}

export class LogarchiveAccountStack2 extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LogarchiveAccountStack2Props) {
    super(scope, id, props)
  }
}
