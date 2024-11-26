import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources'
import { Construct } from 'constructs'

export interface DelegatedAdminProps {
  readonly accountId: string // The delegated admin account ID
  readonly servicePrincipal: string // Service principal to enable and register
}

export abstract class AbstractDelegatedAdmin extends Construct {
  protected constructor(scope: Construct, id: string, props: DelegatedAdminProps) {
    super(scope, id)

    // Enable service access
    const enableServiceAccess = new AwsCustomResource(this, 'EnableServiceAccess', {
      onCreate: {
        service: 'Organizations',
        action: 'enableAWSServiceAccess',
        parameters: {
          ServicePrincipal: props.servicePrincipal,
        },
        physicalResourceId: PhysicalResourceId.of(`EnableServiceAccess-${props.servicePrincipal}`),
      },
      onDelete: {
        service: 'Organizations',
        action: 'disableAWSServiceAccess',
        parameters: {
          ServicePrincipal: props.servicePrincipal,
        },
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({ resources: AwsCustomResourcePolicy.ANY_RESOURCE }),
    })

    // Register delegated admin
    const registerDelegatedAdmin = new AwsCustomResource(this, 'RegisterDelegatedAdmin', {
      onCreate: {
        service: 'Organizations',
        action: 'registerDelegatedAdministrator',
        parameters: {
          AccountId: props.accountId,
          ServicePrincipal: props.servicePrincipal,
        },
        physicalResourceId: PhysicalResourceId.of(`RegisterDelegatedAdmin-${props.servicePrincipal}-${props.accountId}`),
      },
      onDelete: {
        service: 'Organizations',
        action: 'deregisterDelegatedAdministrator',
        parameters: {
          AccountId: props.accountId,
          ServicePrincipal: props.servicePrincipal,
        },
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({ resources: AwsCustomResourcePolicy.ANY_RESOURCE }),
    })

    // Register dependency to enforce order
    registerDelegatedAdmin.node.addDependency(enableServiceAccess)
  }
}
