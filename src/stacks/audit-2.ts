import type { Construct } from 'constructs'
import type { ShareWithOrg } from '../types'
import * as cdk from 'aws-cdk-lib'
import * as config from 'aws-cdk-lib/aws-config'
import * as iam from 'aws-cdk-lib/aws-iam'

interface AuditAccountStack2Props extends cdk.StackProps, ShareWithOrg {}

export class AuditAccountStack2 extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AuditAccountStack2Props) {
    super(scope, id, props)

    const configPrinciple = new iam.ServicePrincipal('config.amazonaws.com')
    const role = new iam.Role(this, 'ConfigAggregatorRole', {
      assumedBy: configPrinciple,
    })
    role.attachInlinePolicy(
      new iam.Policy(this, 'ConfigAggregatorPolicy', {
        statements: [
          new iam.PolicyStatement({
            actions: [
              'config:DescribeConfigurationAggregators',
              'config:DescribeConfigurationAggregatorSourcesStatus',
              'config:DescribePendingAggregationRequests',
              'config:GetAggregateComplianceDetailsByConfigRule',
              'config:GetAggregateDiscoveredResourceCounts',
              'config:BatchGetAggregateResourceConfig',
              'config:SelectAggregateResourceConfig',
              'config:ListAggregateDiscoveredResources',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            actions: ['organizations:DescribeOrganization'],
            resources: ['*'],
          }),
        ],
      }),
    )

    new config.CfnConfigurationAggregator(this, 'P6LzSraConfigAggregator', {
      configurationAggregatorName: 'P6LzSraConfigAggregator',
      organizationAggregationSource: {
        roleArn: role.roleArn,
        allAwsRegions: true,
      },
    })
  }
}
