import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'

interface AuditAccountStack3Props extends cdk.StackProps {}

export class AuditAccountStack3 extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AuditAccountStack3Props) {
    super(scope, id, props)
  }
}
