import type { Construct } from 'constructs'
import type { LogarchiveBucket, ShareWithOrg } from '../types'
import * as cdk from 'aws-cdk-lib'
import * as config from 'aws-cdk-lib/aws-config'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as kms from 'aws-cdk-lib/aws-kms'

export interface IP6LzSraConfigProps extends ShareWithOrg, LogarchiveBucket {}

export class P6LzSraConfig extends cdk.Resource {
  constructor(scope: Construct, id: string, props: IP6LzSraConfigProps) {
    super(scope, id)

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
}
