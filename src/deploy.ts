#!/usr/bin/env node

import process from 'node:process'
import * as cdk from 'aws-cdk-lib'
import { AuditAccountStack1 } from './stacks/audit-1'
import { LogarchiveAccountStack1 } from './stacks/logarchive-1'
import { AvmStack } from './stacks/management-avm'
import { OrganizationStack } from './stacks/management-organization'

const env = {
  account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION,
}

const app = new cdk.App()

const accounts = app.node.tryGetContext('Accounts') as Array<{ Name: string, AccountId: string }>
const auditAccountId = accounts.find(account => account.Name === 'auditAccount')?.AccountId ?? '12345678912'
const devAccountId = accounts.find(account => account.Name === 'devAccount')?.AccountId ?? '12345678912'
const logarchiveAccountId = accounts.find(account => account.Name === 'logarchiveAccount')?.AccountId ?? '12345678912'
const managementAccountId = accounts.find(account => account.Name === 'managementAccount')?.AccountId ?? '12345678912'
const networkAccountId = accounts.find(account => account.Name === 'networkAccount')?.AccountId ?? '12345678912'
const prodAccountId = accounts.find(account => account.Name === 'prodAccount')?.AccountId ?? '12345678912'
const qaAccountId = accounts.find(account => account.Name === 'qaAccount')?.AccountId ?? '12345678912'
const sharedAccountId = accounts.find(account => account.Name === 'sharedAccount')?.AccountId ?? '12345678912'
const sandboxAccountId = accounts.find(account => account.Name === 'sandboxAccount')?.AccountId ?? '12345678912'

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

const organizationStack = new OrganizationStack(app, 'p6-lz-management-organization', {
  env,
  accountAlias: 'p6m7g8',
})
new AvmStack(app, 'p6-lz-management-avm', { env })

new LogarchiveAccountStack1(app, 'p6-lz-logarchive-1', {
  env: {
    account: logarchiveAccountId,
    region: env.region,
  },
  accountAlias: 'p6m7g8-logarchive',
  principals,
})

new AuditAccountStack1(app, 'p6-lz-audit-1', {
  env: {
    account: auditAccountId,
    region: env.region,
  },
  accountAlias: 'p6m7g8-audit',
  principals,
  centralBucketArn: organizationStack.centralBucketArn,
})

app.synth()
