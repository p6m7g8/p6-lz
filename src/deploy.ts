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

const auditAccountId: string = app.node.tryGetContext('auditAccountId') ?? '12345678912'
const devAccountId: string = app.node.tryGetContext('devAccountId') ?? '12345678912'
const logarchiveAccountId: string = app.node.tryGetContext('logarchiveAccountId') ?? '12345678912'
const managementAccountId: string = app.node.tryGetContext('managementAccountId') ?? '12345678912'
const networkAccountId: string = app.node.tryGetContext('networkAccountId') ?? '12345678912'
const prodAccountId: string = app.node.tryGetContext('prodAccountId') ?? '12345678912'
const qaAccountId: string = app.node.tryGetContext('qaAccountId') ?? '12345678912'
const sandboxAccountId: string = app.node.tryGetContext('sandboxAccountId') ?? '12345678912'
const sharedAccountId: string = app.node.tryGetContext('sharedAccountId') ?? '12345678912'

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

const organizationStack = new OrganizationStack(app, 'p6-lz-mgmt-organization', {
  env,
  accountAlias: 'p6m7g8',
})
new AvmStack(app, 'p6-lz-mgmt-avm', { env })

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
