import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
// import { CfnOrganization } from 'aws-cdk-lib/aws-organizations'

export class OrganizationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props)

    // const organization = new CfnOrganization(this, 'Organization', {
    //   featureSet: 'ALL',
    // })
    const accountId = cdk.Stack.of(this).account
    const organizationId: string = 'o-b1ngfg6w8x'
    const organizationArn: string = `arn:aws:organizations::${accountId}:organization/${organizationId}`
    const rootOuId: string = 'r-erd4'

    new cdk.CfnOutput(this, 'OrganizationId', {
      value: organizationId,
    })
    new cdk.CfnOutput(this, 'OrganizationArn', {
      value: organizationArn,
    })
    new cdk.CfnOutput(this, 'RootOuId', {
      value: rootOuId,
    })
  }
}
