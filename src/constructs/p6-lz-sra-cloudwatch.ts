import type { Construct } from 'constructs'
import type { IP6LzAccountAlias } from '../types'
import * as cdk from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as kms from 'aws-cdk-lib/aws-kms'
import * as logs from 'aws-cdk-lib/aws-logs'

export interface IP6LzSraCloudWatchProps extends IP6LzAccountAlias {}

export class P6LzSraCloudWatch extends cdk.Resource {
  public readonly logGroup: logs.ILogGroup
  public readonly logRole: iam.IRole

  constructor(scope: Construct, id: string, props: IP6LzSraCloudWatchProps) {
    super(scope, id)

    const key = new kms.Key(this, 'Key', {
      alias: 'p6/lz/sra/cw-logs-key',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    const logsPrinciple = new iam.ServicePrincipal('logs.amazonaws.com')
    key.grantEncryptDecrypt(logsPrinciple)

    const cloudTrailPrincipal = new iam.ServicePrincipal('cloudtrail.amazonaws.com')
    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/p6/lz/${props.accountAlias}/logarchive`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.FOUR_MONTHS,
      encryptionKey: key,
    })
    this.logGroup.addToResourcePolicy(new iam.PolicyStatement({
      actions: [
        'logs:CreateLogStream',
        'logs:DescribeLogGroups',
        'logs:PutLogEvents',
      ],
      principals: [cloudTrailPrincipal],
      resources: ['*'],
    }))

    const logRole = new iam.Role(this, 'CloudTrailLogRole', {
      assumedBy: cloudTrailPrincipal,
      description: 'Role for CloudTrail to access the CloudWatch log group',
    })
    logRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'logs:CreateLogStream',
        'logs:DescribeLogGroups',
        'logs:PutLogEvents',
      ],
      resources: ['*'],
    }))
    this.logRole = logRole
  }
}
