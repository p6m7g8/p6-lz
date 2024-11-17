import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as config from 'aws-cdk-lib/aws-config'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as securityhub from 'aws-cdk-lib/aws-securityhub'
import { P6CDKNamer } from 'p6-cdk-namer'

interface AuditAccountStackProps extends cdk.StackProps {
  logarchiveAccountId: string
  configBucket: string
}

export class AuditAccountStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AuditAccountStackProps) {
    super(scope, id, props)

    new P6CDKNamer(this, 'P6CDKNamer', {
      accountAlias: 'p6m7g8-audit',
    })

    const configRole = new iam.Role(this, 'RoleAwsConfig', {
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWS_ConfigRole')],
    })

    const deliveryChannel = new config.CfnDeliveryChannel(this, 'DeliveryChannel', {
      s3BucketName: props.configBucket,
      configSnapshotDeliveryProperties: {
        deliveryFrequency: 'One_Hour',
      },
    })

    const configRecorder = new config.CfnConfigurationRecorder(this, 'Recorder', {
      roleArn: configRole.roleArn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
      },
    })

    const hub = new securityhub.CfnHub(this, 'SecurityHub', {})

    // TODO: https://docs.aws.amazon.com/securityhub/latest/userguide/standards-tagging.html
    const findingAggregator = new securityhub.CfnFindingAggregator(this, 'FindingAggregator', {
      regionLinkingMode: 'ALL_REGIONS',
    })
    const organizationConfiguration = new securityhub.CfnOrganizationConfiguration(this, 'OrganizationConfiguration', {
      autoEnable: false,
      autoEnableStandards: 'NONE',
      configurationType: 'CENTRAL',
    })
    organizationConfiguration.node.addDependency(deliveryChannel)
    organizationConfiguration.node.addDependency(configRecorder)
    organizationConfiguration.node.addDependency(findingAggregator)
    organizationConfiguration.node.addDependency(hub)
    findingAggregator.node.addDependency(hub)
  }
}
