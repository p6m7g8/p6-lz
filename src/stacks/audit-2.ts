import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'

interface AuditAccountStack2Props extends cdk.StackProps {}

export class AuditAccountStack2 extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AuditAccountStack2Props) {
    super(scope, id, props)
  }
}
