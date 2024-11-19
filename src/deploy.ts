#!/usr/bin/env node

import process from 'node:process'
import * as cdk from 'aws-cdk-lib'
import { AuditAccountStack1 } from './stacks/audit-1'
import { AuditAccountStack2 } from './stacks/audit-2'
import { AuditAccountStack3 } from './stacks/audit-3'
import { DevAccountStack } from './stacks/dev'
import { LogarchiveAccountStack1 } from './stacks/logarchive-1'
import { LogarchiveAccountStack2 } from './stacks/logarchive-2'
import { ManagementAccountStack3 } from './stacks/management-3'
import { AvmStack } from './stacks/management-avm'
import { OrganizationStack } from './stacks/management-organization'
import { NetworkAccountStack1 } from './stacks/network-1'
import { NetworkAccountStack2 } from './stacks/network-2'
import { ProdAccountStack } from './stacks/prod'
import { QaAccountStack } from './stacks/qa'
import { SandboxAccountStack } from './stacks/sandbox'
import { SharedAccountStack1 } from './stacks/shared-1'
import { SharedAccountStack2 } from './stacks/shared-2'

const env = {
  account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION,
}

const app = new cdk.App()

const accounts = app.node.tryGetContext('Accounts') as Array<{ Name: string, AccountId: string }> ?? []
const auditAccountId = accounts.find(account => account.Name === 'audit')?.AccountId ?? '12345678912'
const devAccountId = accounts.find(account => account.Name === 'dev')?.AccountId ?? '12345678912'
const logarchiveAccountId = accounts.find(account => account.Name === 'logarchive')?.AccountId ?? '12345678912'
const managementAccountId = accounts.find(account => account.Name === 'management')?.AccountId ?? '12345678912'
const networkAccountId = accounts.find(account => account.Name === 'network')?.AccountId ?? '12345678912'
const prodAccountId = accounts.find(account => account.Name === 'prod')?.AccountId ?? '12345678912'
const qaAccountId = accounts.find(account => account.Name === 'qa')?.AccountId ?? '12345678912'
const sharedAccountId = accounts.find(account => account.Name === 'shared')?.AccountId ?? '12345678912'
const sandboxAccountId = accounts.find(account => account.Name === 'sandbox')?.AccountId ?? '12345678912'

const principals: string[] = [
  auditAccountId,
  devAccountId,
  logarchiveAccountId,
  managementAccountId,
  networkAccountId,
  prodAccountId,
  qaAccountId,
  sandboxAccountId,
  sharedAccountId,
]

// ----------------------------------- Phase 1 -----------------------------------
// Mgmt Account
const organizationStack = new OrganizationStack(app, 'p6-lz-management-organization', {
  env,
  accountAlias: 'p6m7g8',
})
new AvmStack(app, 'p6-lz-management-avm', { env })

// ----------------------------------- Phase 3 -----------------------------------
// Logarchive Account
new LogarchiveAccountStack1(app, 'p6-lz-logarchive-1', {
  env: {
    account: logarchiveAccountId,
    region: env.region,
  },
  accountAlias: 'p6m7g8-logarchive',
  principals,
})

new LogarchiveAccountStack2(app, 'p6-lz-logarchive-2', {
  env: {
    account: logarchiveAccountId,
    region: env.region,
  },
  principals,
  centralBucketArn: organizationStack.centralBucketArn,
})

// Audit Account
new AuditAccountStack1(app, 'p6-lz-audit-1', {
  env: {
    account: auditAccountId,
    region: env.region,
  },
  accountAlias: 'p6m7g8-audit',
  principals,
  centralBucketArn: organizationStack.centralBucketArn,
})

new AuditAccountStack2(app, 'p6-lz-audit-2', {
  env: {
    account: auditAccountId,
    region: env.region,
  },
  principals,
})

new AuditAccountStack3(app, 'p6-lz-audit-3', {
  env: {
    account: auditAccountId,
    region: env.region,
  },
})

// Network Account
new NetworkAccountStack1(app, 'p6-lz-network-1', {
  env: {
    account: networkAccountId,
    region: env.region,
  },
  accountAlias: 'p6m7g8-network',
  principals,
})

new NetworkAccountStack2(app, 'p6-lz-network-2', {
  env: {
    account: networkAccountId,
    region: env.region,
  },
  principals,
  centralBucketArn: organizationStack.centralBucketArn,
})

// Shared Account
new SharedAccountStack1(app, 'p6-lz-shared-1', {
  env: {
    account: sharedAccountId,
    region: env.region,
  },
  accountAlias: 'p6m7g8-shared',
  principals,
})

new SharedAccountStack2(app, 'p6-lz-shared-2', {
  env: {
    account: sharedAccountId,
    region: env.region,
  },
  principals,
  centralBucketArn: organizationStack.centralBucketArn,
})

// Management Account
new ManagementAccountStack3(app, 'p6-lz-management-3', {
  env: {
    account: managementAccountId,
    region: env.region,
  },
})

// ----------------------------------- Phase 4 -----------------------------------
// Sandbox
new SandboxAccountStack(app, 'p6-lz-sandbox', {
  env: {
    account: sandboxAccountId,
    region: env.region,
  },
  accountAlias: 'p6m7g8-sandbox',
})

// Dev Account
new DevAccountStack(app, 'p6-lz-dev', {
  env: {
    account: devAccountId,
    region: env.region,
  },
  accountAlias: 'p6m7g8-dev',
})

// QA
new QaAccountStack(app, 'p6-lz-qa', {
  env: {
    account: qaAccountId,
    region: env.region,
  },
  accountAlias: 'p6m7g8-qa',
})

// Prod
new ProdAccountStack(app, 'p6-lz-prod', {
  env: {
    account: prodAccountId,
    region: env.region,
  },
  accountAlias: 'p6m7g8-prod',
})

app.synth()
