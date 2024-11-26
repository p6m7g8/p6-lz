import type { Construct } from 'constructs'
import { AbstractDelegatedAdmin } from './base/p6-lz-delegate-base'

export class CloudTrailDelegatedAdmin extends AbstractDelegatedAdmin {
  constructor(scope: Construct, id: string, accountId: string) {
    super(scope, id, {
      accountId,
      servicePrincipal: 'cloudtrail.amazonaws.com',
    })
  }
}

export class ConfigDelegatedAdmin extends AbstractDelegatedAdmin {
  constructor(scope: Construct, id: string, accountId: string) {
    super(scope, id, {
      accountId,
      servicePrincipal: 'config.amazonaws.com',
    })
  }
}

export class SecurityHubDelegatedAdmin extends AbstractDelegatedAdmin {
  constructor(scope: Construct, id: string, accountId: string) {
    super(scope, id, {
      accountId,
      servicePrincipal: 'securityhub.amazonaws.com',
    })
  }
}

export class InspectorDelegatedAdmin extends AbstractDelegatedAdmin {
  constructor(scope: Construct, id: string, accountId: string) {
    super(scope, id, {
      accountId,
      servicePrincipal: 'inspector2.amazonaws.com',
    })
  }
}
