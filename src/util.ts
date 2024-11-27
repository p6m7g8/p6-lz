import type { Construct } from 'constructs'
import type { IP6LzAccountsConfig, IP6LzConfig, P6LzAwsEnv, P6LzMyIP } from './types'
import * as fs from 'node:fs'
import * as process from 'node:process'
import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as s3 from 'aws-cdk-lib/aws-s3'
import axios from 'axios'
import yaml from 'js-yaml'

export function getCentralBucketName(scope: Construct): string {
  return `p6-lz-sra-logarchive-central-${cdk.Stack.of(scope).region}`
}

export function getCentralBucket(scope: Construct): s3.IBucket {
  const name = getCentralBucketName(scope)
  const arn = `arn:aws:s3:::${name}`
  const bucket = s3.Bucket.fromBucketArn(scope, 'CentralBucket', arn)

  return bucket
}

export async function getPublicIp(): Promise<P6LzMyIP> {
  try {
    const response = await axios.get('https://checkip.amazonaws.com', { timeout: 5000 })
    const publicIp = response.data.trim()
    return ec2.Peer.ipv4(`${publicIp}/32`)
  }
  catch (error) {
    console.error('Error fetching public IP:', error)
    throw new Error('Failed to retrieve public IP address.')
  }
}

export async function loadConfig(): Promise<IP6LzConfig> {
  const env: P6LzAwsEnv = {
    account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION,
  }

  const config: IP6LzAccountsConfig = yaml.load(fs.readFileSync('conf/accounts.yml', 'utf8')) as IP6LzAccountsConfig
  const myIp: P6LzMyIP = await getPublicIp()

  return {
    env,
    myIp,
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
