import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as securityhub from 'aws-cdk-lib/aws-securityhub'
import { P6CDKNamer } from 'p6-cdk-namer'

interface AuditAccountStackProps extends cdk.StackProps {
  organizationId: string
  logarchiveAccountId: string
}

export class AuditAccountStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AuditAccountStackProps) {
    super(scope, id, props)

    new P6CDKNamer(this, 'P6CDKNamer', {
      accountAlias: 'p6m7g8-audit',
    })
    // TODO: https://docs.aws.amazon.com/securityhub/latest/userguide/standards-tagging.html
    new securityhub.CfnOrganizationConfiguration(this, 'OrganizationConfiguration', {
      autoEnable: false,
      autoEnableStandards: 'NONE',
      configurationType: 'CENTRAL',
    })
    new securityhub.CfnFindingAggregator(this, 'FindingAggregator', {
      regionLinkingMode: 'ALL_REGIONS',
    })

    // const configRole = new iam.Role(this, 'AWSConfigRole', {
    //   assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
    //   managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWS_ConfigRole')],
    // })

    // new configservice.CfnConfigurationRecorder(this, 'ConfigRecorder', {
    //   roleArn: configRole.roleArn,
    //   recordingGroup: {
    //     allSupported: true,
    //     includeGlobalResourceTypes: true,
    //   },
    // })
  }
}
