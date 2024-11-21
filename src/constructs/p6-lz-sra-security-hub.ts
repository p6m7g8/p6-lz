import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as securityhub from 'aws-cdk-lib/aws-securityhub'

export interface IP6LzSraSecurityhubProps extends cdk.StackProps {
  // @default false
  isCentral?: boolean
}

export class P6LzSraSecurityhub extends cdk.Resource {
  constructor(scope: Construct, id: string, props: IP6LzSraSecurityhubProps) {
    super(scope, id)

    props.isCentral = props?.isCentral ?? false

    // this.securityhub()
    if (props.isCentral) {
      this.securityhubCentral()
    }
  }

  private securityhubCentral() {
    const findingAggregator = new securityhub.CfnFindingAggregator(this, 'FindingAggregator', {
      regionLinkingMode: 'ALL_REGIONS',
    })
    const organizationConfiguration = new securityhub.CfnOrganizationConfiguration(this, 'OrganizationConfiguration', {
      autoEnable: false,
      autoEnableStandards: 'NONE',
      configurationType: 'CENTRAL',
    })
    organizationConfiguration.node.addDependency(findingAggregator)

    const cisArn140 = `arn:${cdk.Aws.PARTITION}:securityhub:${cdk.Stack.of(this).region}::standards/cis-aws-foundations-benchmark/v/1.4.0`
    const enableCisStandard140 = new securityhub.CfnStandard(this, 'EnableCISStandard140', {
      standardsArn: cisArn140,
    })
    enableCisStandard140.node.addDependency(organizationConfiguration)

    const cisArn300 = `arn:${cdk.Aws.PARTITION}:securityhub:${cdk.Stack.of(this).region}::standards/cis-aws-foundations-benchmark/v/3.0.0`
    const enableCisStandard300 = new securityhub.CfnStandard(this, 'EnableCISStandard300', {
      standardsArn: cisArn300,
    })
    enableCisStandard300.node.addDependency(organizationConfiguration)
  }
}
