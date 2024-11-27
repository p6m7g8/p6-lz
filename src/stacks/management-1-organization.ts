import type { Construct } from 'constructs'
import type { IP6LzAccountAlias } from '../types'
import * as cdk from 'aws-cdk-lib'
import { P6CDKNamer } from 'p6-cdk-namer'
// import { CfnOrganization } from 'aws-cdk-lib/aws-organizations'

interface OrganizationStackProps extends cdk.StackProps, IP6LzAccountAlias {}

export class OrganizationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: OrganizationStackProps) {
    super(scope, id, props)

    // const organization = new CfnOrganization(this, 'Organization', {
    //   featureSet: 'ALL',
    // })
    new P6CDKNamer(this, 'P6LzCdkNamer', {
      accountAlias: props.accountAlias,
    })
  }
}
