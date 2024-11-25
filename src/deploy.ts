#!/usr/bin/env node

import type { IAccountsConfig } from './types'
import fs from 'node:fs'
import process from 'node:process'
import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import yaml from 'js-yaml'
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

function loadConfig(): any {
  const env = {
    account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION,
  }

  const config: IAccountsConfig = yaml.load(fs.readFileSync('conf/accounts.yml', 'utf8')) as IAccountsConfig
  const myIp: any = (yaml.load(fs.readFileSync('conf/myip.yml', 'utf8')) as any).myIp
  const logarchiveBucketArn: any = (yaml.load(fs.readFileSync('conf/central-bucket.yml', 'utf8')) as any).logarchiveBucketArn

  return {
    env,
    myIp,
    logarchiveBucketArn,
    accounts: config.accounts,
    principals: [
      config.accounts.audit.AccountId,
      config.accounts.dev.AccountId,
      config.accounts.logarchive.AccountId,
      config.accounts.management.AccountId,
      config.accounts.network.AccountId,
      config.accounts.prod.AccountId,
      config.accounts.qa.AccountId,
      config.accounts.sandbox.AccountId,
      config.accounts.shared.AccountId,
    ],
  }
}

function main() {
  const config = loadConfig()

  const app = new cdk.App()

  // ----------------------------------- Phase 1 -----------------------------------
  // Mgmt Account
  new OrganizationStack(app, 'p6-lz-management-1-organization', {
    env: config.env,
    accountAlias: config.accounts.management.Name,
  })
  new AvmStack(app, 'p6-lz-management-1-avm', {
    env: config.env,
  })

  // ----------------------------------- Phase 3 -----------------------------------
  // Logarchive Account
  new LogarchiveAccountStack1(app, 'p6-lz-logarchive-1', {
    env: {
      account: config.accounts.logarchive.AccountId,
      region: config.env.region,
    },
    accountAlias: config.accounts.logarchive.Name,
    principals: config.principals,
  })

  new LogarchiveAccountStack2(app, 'p6-lz-logarchive-2', {
    env: {
      account: config.accounts.logarchive.AccountId,
      region: config.env.region,
    },
    principals: config.principals,
    centralBucketArn: config.logarchiveBucketArn,
  })

  // Audit Account
  new AuditAccountStack1(app, 'p6-lz-audit-1', {
    env: {
      account: config.accounts.audit.AccountId,
      region: config.env.region,
    },
    accountAlias: config.accounts.audit.Name,
    principals: config.principals,
    centralBucketArn: config.logarchiveBucketArn,
  })

  new AuditAccountStack2(app, 'p6-lz-audit-2', {
    env: {
      account: config.accounts.audit.AccountId,
      region: config.env.region,
    },
    principals: config.principals,
    centralBucketArn: config.logarchiveBucketArn,
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
    centralBucketArn: config.logarchiveBucketArn,
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
    centralBucketArn: config.logarchiveBucketArn,
  })

  // Management Account
  new ManagementAccountStack3(app, 'p6-lz-management-3', {
    env: {
      account: config.accounts.management.AccountId,
      region: config.env.region,
    },
  })

  // ----------------------------------- Phase 4 -----------------------------------
  // Sandbox
  new SandboxAccountStack(app, 'p6-lz-sandbox', {
    env: {
      account: config.accounts.sandbox.AccountId,
      region: config.env.region,
    },
    accountAlias: config.accounts.sandbox.Name,
    cidr: ec2.IpAddresses.cidr(config.accounts.sandbox.Vpc.cidr),
    myIp: ec2.Peer.ipv4(config.myIp),
  })

  // Dev Account
  new DevAccountStack(app, 'p6-lz-dev', {
    env: {
      account: config.accounts.dev.AccountId,
      region: config.env.region,
    },
    accountAlias: config.accounts.dev.Name,
    cidr: ec2.IpAddresses.cidr(config.accounts.dev.Vpc.cidr),
    myIp: ec2.Peer.ipv4(config.myIp),
  })

  // QA
  new QaAccountStack(app, 'p6-lz-qa', {
    env: {
      account: config.accounts.qa.AccountId,
      region: config.env.region,
    },
    accountAlias: config.accounts.qa.Name,
    cidr: ec2.IpAddresses.cidr(config.accounts.qa.Vpc.cidr),
    myIp: ec2.Peer.ipv4(config.myIp),
  })

  // Prod
  new ProdAccountStack(app, 'p6-lz-prod', {
    env: {
      account: config.accounts.prod.AccountId,
      region: config.env.region,
    },
    accountAlias: config.accounts.prod.Name,
    cidr: ec2.IpAddresses.cidr(config.accounts.prod.Vpc.cidr),
    myIp: ec2.Peer.ipv4(config.myIp),
  })

  app.synth()
}

main()
