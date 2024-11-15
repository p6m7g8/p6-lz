#!/usr/bin/env node

import process from 'node:process'
import * as cdk from 'aws-cdk-lib'
import { AuditAccountStack } from './audit'
import { AVMStack } from './avm'
import { DevAccountStack } from './dev'
import { LogarchiveAccountStack } from './logarchive'
import { OrganizationStack } from './organization'
import { ProdAccountStack } from './prod'
import { SandboxAccountStack } from './sandbox'
import { SharedAccountStack } from './shared'

const env = {
  account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION,
}

const app = new cdk.App()
const logarchiveAccountId = app.node.tryGetContext('logarchiveAccountId')
const auditAccountId = app.node.tryGetContext('auditAccountId')
const sharedAccountId = app.node.tryGetContext('sharedAccountId')
const sandboxAccountId = app.node.tryGetContext('sandboxAccountId')
const devAccountId = app.node.tryGetContext('devAccountId')
const prodAccountId = app.node.tryGetContext('prodAccountId')
const organizationId = app.node.tryGetContext('organizationId')

new OrganizationStack(app, 'p6-lz-organization', { env })
new AVMStack(app, 'p6-lz-avm', { env })

const logarchiveAccountStack = new LogarchiveAccountStack(app, 'p6-lz-logarchive', {
  env: {
    account: logarchiveAccountId,
    region: env.region,
  },
  organizationId,
})

const auditAccountStack = new AuditAccountStack(app, 'p6-lz-audit', {
  env: {
    account: auditAccountId,
    region: env.region,
  },
  logarchiveAccountId,
  organizationId,
})
auditAccountStack.addDependency(logarchiveAccountStack)

const sharedAccountStack = new SharedAccountStack(app, 'p6-lz-shared', {
  env: {
    account: sharedAccountId,
    region: env.region,
  },
  logarchiveAccountId,
})
sharedAccountStack.addDependency(logarchiveAccountStack)

const sandboxAccountStack = new SandboxAccountStack(app, 'p6-lz-sandbox', {
  env: {
    account: sandboxAccountId,
    region: env.region,
  },
})
sandboxAccountStack.addDependency(sharedAccountStack)
sandboxAccountStack.addDependency(auditAccountStack)
sandboxAccountStack.addDependency(logarchiveAccountStack)

const devAccountStack = new DevAccountStack(app, 'p6-lz-dev', {
  env: {
    account: devAccountId,
    region: env.region,
  },
})
devAccountStack.addDependency(sharedAccountStack)
devAccountStack.addDependency(auditAccountStack)
devAccountStack.addDependency(logarchiveAccountStack)

const prodAccountStack = new ProdAccountStack(app, 'p6-lz-prod', {
  env: {
    account: prodAccountId,
    region: env.region,
  },
})
prodAccountStack.addDependency(sharedAccountStack)
prodAccountStack.addDependency(auditAccountStack)
prodAccountStack.addDependency(logarchiveAccountStack)

app.synth()
