import type { Construct } from 'constructs'
import type { IAccountIds, IShareWithOrg } from '../types'
import * as cdk from 'aws-cdk-lib'
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources'

export interface IP6LzSraInspectorProps extends cdk.StackProps, IAccountIds, IShareWithOrg {}

export class P6LzSraInspector extends cdk.Resource {
  constructor(scope: Construct, id: string, props: IP6LzSraInspectorProps) {
    super(scope, id)

    const delegation = new AwsCustomResource(this, 'EnableInspector2DelegatedAdmin', {
      onCreate: {
        service: 'Inspector2',
        action: 'enableDelegatedAdminAccount',
        parameters: {
          delegatedAdminAccountId: props.auditAccountId,
        },
        physicalResourceId: PhysicalResourceId.of(`EnableInspector2DelegatedAdmin-${props.auditAccountId}`),
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({ resources: AwsCustomResourcePolicy.ANY_RESOURCE }),
    })

    const orgPolicy = new AwsCustomResource(this, 'UpdateInspector2OrgConfig', {
      onCreate: {
        service: 'Inspector2',
        action: 'updateOrganizationConfiguration',
        parameters: {
          autoEnable: 'ec2=true,ecr=true,lambda=true',
        },
        physicalResourceId: PhysicalResourceId.of('UpdateInspector2OrgConfig-ec2=true,ecr=true,lambda=true'),
      },
      onUpdate: {
        service: 'Inspector2',
        action: 'updateOrganizationConfiguration',
        parameters: {
          autoEnable: 'ec2=true,ecr=true,lambda=true',
        },
        physicalResourceId: PhysicalResourceId.of('UpdateInspector2OrgConfig-ec2=true,ecr=true,lambda=true'),
      },
      onDelete: {
        service: 'Inspector2',
        action: 'updateOrganizationConfiguration',
        parameters: {
          autoEnable: 'ec2=false,ecr=false,lambda=false',
        },
        physicalResourceId: PhysicalResourceId.of('UpdateInspector2OrgConfig-ec2=false,ecr=false,lambda=false'),
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({ resources: AwsCustomResourcePolicy.ANY_RESOURCE }),
    })
    orgPolicy.node.addDependency(delegation)

    const resourceTypes = ['EC2', 'ECR', 'LAMBDA', 'LAMBDA_CODE']
    const enabled = new AwsCustomResource(this, 'EnableInspector2', {
      onCreate: {
        service: 'Inspector2',
        action: 'enable',
        parameters: {
          accountIds: props.principals,
          resourceTypes,
        },
        physicalResourceId: PhysicalResourceId.of(`EnableInspector2-${props.principals.join(',')}-${resourceTypes.join(',')}`),
      },
      onUpdate: {
        service: 'Inspector2',
        action: 'enable',
        parameters: {
          accountIds: props.principals,
          resourceTypes,
        },
        physicalResourceId: PhysicalResourceId.of(`EnableInspector2-${props.principals.join(',')}-${resourceTypes.join(',')}`),
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({ resources: AwsCustomResourcePolicy.ANY_RESOURCE }),
    })
    enabled.node.addDependency(orgPolicy)

    // TODO: associate member accounts (1 at a time for rate limiting)
  }
}
