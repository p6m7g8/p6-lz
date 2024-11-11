#!/usr/bin/env node

import process from 'node:process'
import * as cdk from 'aws-cdk-lib'
import { AuditAccountStack } from './audit'
import { AVMStack } from './avm'
import { LogarchiveAccountStack } from './logarchive'
import { OrganizationStack } from './organization'
import { SharedAccountStack } from './shared'

const env = {
  account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION,
}

const app = new cdk.App()
const auditAccountId = app.node.tryGetContext('auditAccountId')
const logarchiveAccountId = app.node.tryGetContext('logarchiveAccountId')
const sharedAccountId = app.node.tryGetContext('sharedAccountId')

new OrganizationStack(app, 'p6-lz-organization', { env })
new AVMStack(app, 'p6-lz-avm', { env })
new AuditAccountStack(app, 'p6-lz-audit', {
  env: {
    account: auditAccountId,
    region: env.region,
  },
})
new LogarchiveAccountStack(app, 'p6-lz-logarchive', {
  env: {
    account: logarchiveAccountId,
    region: env.region,
  },
})
new SharedAccountStack(app, 'p6-lz-shared', {
  env: {
    account: sharedAccountId,
    region: env.region,
  },
})
app.synth()
