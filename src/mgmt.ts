import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'

interface MgmtAccountStackProps extends cdk.StackProps {
  auditAccountId: string
}

export class MgmtAccountStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MgmtAccountStackProps) {
    super(scope, id, props)

    // XXX: CDK bootstrap is daft
    const auditAccountId = props.auditAccountId ?? '123456789012'

    new iam.CfnServiceLinkedRole(this, 'EnableCloudTrailTrustedAccess', {
      awsServiceName: 'cloudtrail.amazonaws.com',
    })

    const cloudTrailAdminRole = new iam.Role(this, 'CloudTrailAdminRole', {
      assumedBy: new iam.AccountPrincipal(auditAccountId),
      description: 'Role allowing the audit account to manage CloudTrail organization trails',
    })

    cloudTrailAdminRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'sts:AssumeRole',
          'cloudtrail:CreateTrail',
          'cloudtrail:DeleteTrail',
          'cloudtrail:UpdateTrail',
          'cloudtrail:StartLogging',
          'cloudtrail:StopLogging',
          'organizations:DescribeOrganization',
          'organizations:ListAWSServiceAccessForOrganization',
          'organizations:EnableAWSServiceAccess',
          'organizations:DisableAWSServiceAccess',
        ],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'aws:PrincipalArn': `arn:aws:iam::${auditAccountId}:role/OrganizationAccountAccessRole`,
          },
        },
      }),
    )
  }
}
