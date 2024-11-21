import type { Construct } from 'constructs'
import type { LogarchiveBucket, ShareWithOrg } from '../types'
import * as cdk from 'aws-cdk-lib'
import * as config from 'aws-cdk-lib/aws-config'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as kms from 'aws-cdk-lib/aws-kms'

export interface IP6LzSraConfigProps extends ShareWithOrg, LogarchiveBucket {
  // @default false
  isCentral?: boolean
}

export class P6LzSraConfig extends cdk.Resource {
  constructor(scope: Construct, id: string, props: IP6LzSraConfigProps) {
    super(scope, id)

    props.isCentral = props.isCentral ?? false
    this.config(props)
    if (props.isCentral) {
      this.configAggregator()
    }
  }

  private config(props: IP6LzSraConfigProps) {
    const principals = props.principals.map(principal => new iam.AccountPrincipal(principal))
    const key = new kms.Key(this, 'Key', {
      alias: 'p6/lz/sra/config-Key',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })
    key.addToResourcePolicy(
      new iam.PolicyStatement({
        principals,
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:DescribeKey',
        ],
        resources: ['*'],
      }),
    )

    const configPrincipal = new iam.ServicePrincipal('config.amazonaws.com')
    const configRole = new iam.Role(this, 'RoleAwsConfig', {
      assumedBy: configPrincipal,
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWS_ConfigRole')],
    })

    new config.CfnDeliveryChannel(this, 'DeliveryChannel', {
      s3BucketName: props.centralBucket.bucketName,
      configSnapshotDeliveryProperties: {
        deliveryFrequency: 'One_Hour',
      },
    })

    new config.CfnConfigurationRecorder(this, 'Recorder', {
      roleArn: configRole.roleArn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
      },
    })
  }

  private configAggregator() {
    const configPrincipal = new iam.ServicePrincipal('config.amazonaws.com')
    const role = new iam.Role(this, 'ConfigAggregatorRole', {
      assumedBy: configPrincipal,
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

    new config.CfnConfigurationAggregator(this, 'ConfigAggregator', {
      configurationAggregatorName: 'P6LzSraConfigAggregator',
      organizationAggregationSource: {
        roleArn: role.roleArn,
        allAwsRegions: true,
      },
    })
  }
}
