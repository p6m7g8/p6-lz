import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as ssm from 'aws-cdk-lib/aws-ssm'
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

    // Store OrganizationId in SSM
    new ssm.StringParameter(this, 'OrganizationIdParameter', {
      parameterName: '/organization/id',
      stringValue: organizationId,
      description: 'The AWS Organization ID',
    })

    // Store OrganizationArn in SSM
    new ssm.StringParameter(this, 'OrganizationArnParameter', {
      parameterName: '/organization/arn',
      stringValue: organizationArn,
      description: 'The AWS Organization ARN',
    })

    // Store RootOuId in SSM
    new ssm.StringParameter(this, 'RootOuIdParameter', {
      parameterName: '/organization/root-ou-id',
      stringValue: rootOuId,
      description: 'The root Organizational Unit (OU) ID',
    })
  }
}
