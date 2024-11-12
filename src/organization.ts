import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import * as floyd from 'cdk-iam-floyd'
// import { CfnOrganization } from 'aws-cdk-lib/aws-organizations'

export class OrganizationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props)

    // const organization = new CfnOrganization(this, 'Organization', {
    //   featureSet: 'ALL',
    // })

    // const organizationId: string = 'o-b1ngfg6w8x'
    // const rootOuId: string = 'r-erd4'
    // const accountId = cdk.Stack.of(this).account
    // const organizationArn: string = `arn:aws:organizations::${accountId}:organization/${organizationId}`
  }
}
