import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import { P6CDKNamer } from 'p6-cdk-namer'
// import { CfnOrganization } from 'aws-cdk-lib/aws-organizations'

export class OrganizationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props)

    new P6CDKNamer(this, 'P6CDKNamer', {
      accountAlias: 'p6m7g8',
    })
    // const organization = new CfnOrganization(this, 'Organization', {
    //   featureSet: 'ALL',
    // })
  }
}
