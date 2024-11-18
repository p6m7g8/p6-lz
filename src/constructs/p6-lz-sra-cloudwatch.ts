import type { Construct } from 'constructs'
import type { AccountAlias } from '../types'
import * as cdk from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as kms from 'aws-cdk-lib/aws-kms'
import * as logs from 'aws-cdk-lib/aws-logs'

export interface IP6LzSraCloudWatchProps extends AccountAlias {}

export class P6LzSraCloudWatch extends cdk.Resource {
  public readonly logGroup: logs.LogGroup
  public readonly logRole: iam.Role
  constructor(scope: Construct, id: string, props: IP6LzSraCloudWatchProps) {
    super(scope, id)

    const cloudTrailPrincipal = new iam.ServicePrincipal('cloudtrail.amazonaws.com')
    const logsPrinciple = new iam.ServicePrincipal('logs.amazonaws.com')

    const key = new kms.Key(this, 'Key', {
      alias: 'p6/lz/sra/cw-logs-key',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    key.grantEncryptDecrypt(logsPrinciple)

    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/p6/lz/${props.accountAlias}/logarchive`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.FOUR_MONTHS,
      encryptionKey: key,
    })

    this.logRole = new iam.Role(this, 'LogsRole', { assumedBy: cloudTrailPrincipal })
    this.logRole.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: [
        'logs:PutLogEvents',
        'logs:CreateLogStream',
      ],
      resources: [this.logGroup.logGroupArn],
    }))
  }
}
