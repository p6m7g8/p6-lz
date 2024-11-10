import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
// import { CfnOrganization } from 'aws-cdk-lib/aws-organizations'

export class OrganizationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props)

    // const organization = new CfnOrganization(this, 'Organization', {
    //   featureSet: 'ALL',
    // })
  }
}
