#!/usr/bin/env node

import process from 'node:process'
import * as cdk from 'aws-cdk-lib'
import { AccountVendingMachineStack } from '../src/avm'
import { OrganizationStack } from '../src/organization'

const env = {
  account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION,
}

const app = new cdk.App()
new OrganizationStack(app, 'p6-lz-organization', { env })
new AccountVendingMachineStack(app, 'p6-lz-avm', { env })
app.synth()
