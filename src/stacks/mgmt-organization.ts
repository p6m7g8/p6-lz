import type { Construct } from 'constructs'
import type { AccountAlias } from '../types'
import * as cdk from 'aws-cdk-lib'
import { P6CDKNamer } from 'p6-cdk-namer'
// import { CfnOrganization } from 'aws-cdk-lib/aws-organizations'

interface OrganizationStackProps extends cdk.StackProps, AccountAlias {}

export class OrganizationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: OrganizationStackProps) {
    super(scope, id, props)

    new P6CDKNamer(this, 'P6LzCdkNamer', {
      accountAlias: props.accountAlias,
    })

    // const organization = new CfnOrganization(this, 'Organization', {
    //   featureSet: 'ALL',
    // })
  }
}
