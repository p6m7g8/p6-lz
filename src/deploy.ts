#!/usr/bin/env node

import process from 'node:process'
import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { AuditAccountStack1 } from './stacks/audit-1'
import { AuditAccountStack2 } from './stacks/audit-2'
import { AuditAccountStack3 } from './stacks/audit-3'
import { DevAccountStack } from './stacks/dev'
import { LogarchiveAccountStack1 } from './stacks/logarchive-1'
import { LogarchiveAccountStack2 } from './stacks/logarchive-2'
import { AvmStack } from './stacks/management-1-avm'
import { OrganizationStack } from './stacks/management-1-organization'
import { ManagementAccountStack3 } from './stacks/management-3'
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
const auditAccountId = accounts.find(account => account.Name === 'audit')?.AccountId ?? '012345678912'
const devAccountId = accounts.find(account => account.Name === 'dev')?.AccountId ?? '012345678912'
const logarchiveAccountId = accounts.find(account => account.Name === 'logarchive')?.AccountId ?? '012345678912'
const managementAccountId = accounts.find(account => account.Name === 'management')?.AccountId ?? '012345678912'
const networkAccountId = accounts.find(account => account.Name === 'network')?.AccountId ?? '012345678912'
const prodAccountId = accounts.find(account => account.Name === 'prod')?.AccountId ?? '0123456789012'
const qaAccountId = accounts.find(account => account.Name === 'qa')?.AccountId ?? '012345678912'
const sharedAccountId = accounts.find(account => account.Name === 'shared')?.AccountId ?? '012345678912'
const sandboxAccountId = accounts.find(account => account.Name === 'sandbox')?.AccountId ?? '012345678912'
const myIp = app.node.tryGetContext('my-ip') ?? '0.0.0.1/32'

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
const organizationStack = new OrganizationStack(app, 'p6-lz-management-1-organization', {
  env,
  accountAlias: 'p6m7g8',
})
new AvmStack(app, 'p6-lz-management-1-avm', { env })

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
  centralBucketArn: organizationStack.centralBucketArn,
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
  cidr: ec2.IpAddresses.cidr('10.252.0.0/16'),
  myIp: ec2.Peer.ipv4(myIp),
})

// Dev Account
new DevAccountStack(app, 'p6-lz-dev', {
  env: {
    account: devAccountId,
    region: env.region,
  },
  accountAlias: 'p6m7g8-dev',
  cidr: ec2.IpAddresses.cidr('10.253.0.0/16'),
  myIp: ec2.Peer.ipv4(myIp),
})

// QA
new QaAccountStack(app, 'p6-lz-qa', {
  env: {
    account: qaAccountId,
    region: env.region,
  },
  accountAlias: 'p6m7g8-qa',
  cidr: ec2.IpAddresses.cidr('10.254.0.0/16'),
  myIp: ec2.Peer.ipv4(myIp),
})

// Prod
new ProdAccountStack(app, 'p6-lz-prod', {
  env: {
    account: prodAccountId,
    region: env.region,
  },
  accountAlias: 'p6m7g8-prod',
  cidr: ec2.IpAddresses.cidr('10.255.0.0/16'),
  myIp: ec2.Peer.ipv4(myIp),
})

app.synth()
