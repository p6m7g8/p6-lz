import type * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { AuditAccountStack1 } from './stacks/audit-1'
import { AuditAccountStack2 } from './stacks/audit-2'
import { AuditAccountStack3 } from './stacks/audit-3'
import { DevAccountStack } from './stacks/dev'
import { LogarchiveAccountStack1 } from './stacks/logarchive-1'
import { LogarchiveAccountStack2 } from './stacks/logarchive-2'
import { AvmStack } from './stacks/management-1-avm'
import { OrganizationStack } from './stacks/management-1-organization'
import { ManagementAccountCloudTrailStack2 } from './stacks/management-2-cloudtrail'
import { ManagementAccountConfigStack2 } from './stacks/management-2-config'
import { ManagementAccountInspectorStack2 } from './stacks/management-2-inspector'
import { ManagementAccountSecurityHubStack2 } from './stacks/management-2-securityhub'
import { ManagementAccountStack3 } from './stacks/management-3'
import { NetworkAccountStack1 } from './stacks/network-1'
import { NetworkAccountStack2 } from './stacks/network-2'
import { ProdAccountStack } from './stacks/prod'
import { QaAccountStack } from './stacks/qa'
import { SandboxAccountStack } from './stacks/sandbox'
import { SharedAccountStack1 } from './stacks/shared-1'
import { SharedAccountStack2 } from './stacks/shared-2'

export function phase1(app: cdk.App, config: any) {
  // Management Account
  new OrganizationStack(app, 'p6-lz-management-1-organization', {
    env: config.env,
    accountAlias: config.accounts.management.Name,
  })
  new AvmStack(app, 'p6-lz-management-1-avm', {
    env: config.env,
  })
}

export function phase2(app: cdk.App, config: any) {
  // Logarchive Account
  new LogarchiveAccountStack1(app, 'p6-lz-logarchive-1', {
    env: {
      account: config.accounts.logarchive.AccountId,
      region: config.env.region,
    },
    accountAlias: config.accounts.logarchive.Name,
    principals: config.principals,
  })
}

export function phase3(app: cdk.App, config: any) {
  // Management Account
  new ManagementAccountCloudTrailStack2(app, 'p6-lz-management-2-cloudtrail', {
    env: {
      account: config.accounts.management.AccountId,
      region: config.env.region,
    },
    auditAccountId: config.accounts.audit.AccountId,
  })
  new ManagementAccountConfigStack2(app, 'p6-lz-management-2-config', {
    env: {
      account: config.accounts.management.AccountId,
      region: config.env.region,
    },
    auditAccountId: config.accounts.audit.AccountId,
  })
  new ManagementAccountSecurityHubStack2(app, 'p6-lz-management-2-securityhub', {
    env: {
      account: config.accounts.management.AccountId,
      region: config.env.region,
    },
    auditAccountId: config.accounts.audit.AccountId,
  })
  new ManagementAccountInspectorStack2(app, 'p6-lz-management-2-inspector', {
    env: {
      account: config.accounts.management.AccountId,
      region: config.env.region,
    },
    auditAccountId: config.accounts.audit.AccountId,
  })

  // Logarchive Account
  new LogarchiveAccountStack2(app, 'p6-lz-logarchive-2', {
    env: {
      account: config.accounts.logarchive.AccountId,
      region: config.env.region,
    },
    principals: config.principals,
  })

  // Audit Account
  new AuditAccountStack1(app, 'p6-lz-audit-1', {
    env: {
      account: config.accounts.audit.AccountId,
      region: config.env.region,
    },
    accountAlias: config.accounts.audit.Name,
    principals: config.principals,
  })

  new AuditAccountStack2(app, 'p6-lz-audit-2', {
    env: {
      account: config.accounts.audit.AccountId,
      region: config.env.region,
    },
    principals: config.principals,
  })

  new AuditAccountStack3(app, 'p6-lz-audit-3', {
    env: {
      account: config.accounts.audit.AccountId,
      region: config.env.region,
    },
  })

  // Network Account
  new NetworkAccountStack1(app, 'p6-lz-network-1', {
    env: {
      account: config.accounts.network.AccountId,
      region: config.env.region,
    },
    accountAlias: config.accounts.network.Name,
    principals: config.principals,
  })

  new NetworkAccountStack2(app, 'p6-lz-network-2', {
    env: {
      account: config.accounts.network.AccountId,
      region: config.env.region,
    },
    principals: config.principals,
  })

  // Shared Account
  new SharedAccountStack1(app, 'p6-lz-shared-1', {
    env: {
      account: config.accounts.shared.AccountId,
      region: config.env.region,
    },
    accountAlias: config.accounts.shared.Name,
    principals: config.principals,
  })

  new SharedAccountStack2(app, 'p6-lz-shared-2', {
    env: {
      account: config.accounts.shared.AccountId,
      region: config.env.region,
    },
    principals: config.principals,
  })

  // Management Account
  new ManagementAccountStack3(app, 'p6-lz-management-3', {
    env: {
      account: config.accounts.management.AccountId,
      region: config.env.region,
    },
  })
}

export function phase4(app: cdk.App, config: any) {
  // Sandbox
  new SandboxAccountStack(app, 'p6-lz-sandbox', {
    env: {
      account: config.accounts.sandbox.AccountId,
      region: config.env.region,
    },
    accountAlias: config.accounts.sandbox.Name,
    cidr: ec2.IpAddresses.cidr(config.accounts.sandbox.Vpc.cidr),
    myIp: config.myIp,
  })

  // Dev Account
  new DevAccountStack(app, 'p6-lz-dev', {
    env: {
      account: config.accounts.dev.AccountId,
      region: config.env.region,
    },
    accountAlias: config.accounts.dev.Name,
    cidr: ec2.IpAddresses.cidr(config.accounts.dev.Vpc.cidr),
    myIp: config.myIp,
  })

  // QA Account
  new QaAccountStack(app, 'p6-lz-qa', {
    env: {
      account: config.accounts.qa.AccountId,
      region: config.env.region,
    },
    accountAlias: config.accounts.qa.Name,
    cidr: ec2.IpAddresses.cidr(config.accounts.qa.Vpc.cidr),
    myIp: config.myIp,
  })

  // Prod Account
  new ProdAccountStack(app, 'p6-lz-prod', {
    env: {
      account: config.accounts.prod.AccountId,
      region: config.env.region,
    },
    accountAlias: config.accounts.prod.Name,
    cidr: ec2.IpAddresses.cidr(config.accounts.prod.Vpc.cidr),
    myIp: config.myIp,
  })
}
