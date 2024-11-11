#!/usr/bin/env node

import process from 'node:process'
import * as cdk from 'aws-cdk-lib'
import { AuditAccountStack } from './audit'
import { AVMStack } from './avm'
import { OrganizationStack } from './organization'

const env = {
  account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION,
}

const app = new cdk.App()
new OrganizationStack(app, 'p6-lz-organization', { env })
const avmStack = new AVMStack(app, 'p6-lz-avm', { env })
new AuditAccountStack(app, 'p6-lz-audit', {
  env: {
    account: avmStack.auditAccountId,
    region: env.region,
  },
})
app.synth()
