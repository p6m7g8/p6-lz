import type { OrganizationalUnit } from '@aws-sdk/client-organizations'
import type * as ec2 from 'aws-cdk-lib/aws-ec2'
import type * as s3 from 'aws-cdk-lib/aws-s3'

export type P6LzAccountType =
  | 'audit'
  | 'dev'
  | 'logarchive'
  | 'management'
  | 'network'
  | 'prod'
  | 'qa'
  | 'sandbox'
  | 'shared'
export type P6LzMyOrganizationalUnits = IP6LzOrganizationalUnit[]
export type P6LzOrganizationalUnits = OrganizationalUnit[]
export type P6LzAccount = string
export type P6LzAccountAlias = string
export type P6LzCidr = ec2.IIpAddresses
export type P6LzCidrRaw = string
export type P6LzMyIP = ec2.IPeer
export type P6LzPrincipal = string
export type P6LzPrincipals = P6LzPrincipal[]
export type P6LzRegion = string

export interface IP6LzAwsEnv {
  account?: P6LzAccount
  region?: P6LzRegion
}

export interface IP6LzAccountIds {
  auditAccountId?: P6LzAccount
  devAccountId?: P6LzAccount
  logarchiveAccountId?: P6LzAccount
  managementAccountId?: P6LzAccount
  networkAccountId?: P6LzAccount
  prodAccountId?: P6LzAccount
  qaAccountId?: P6LzAccount
  sandboxAccountId?: P6LzAccount
  sharedAccountId?: P6LzAccount
}

export interface IP6LzAccountAlias {
  accountAlias: P6LzAccountAlias
}

export interface IP6LzShareWithOrg {
  principals: P6LzPrincipals
}

export interface IP6LzLogarchiveBucket {
  centralBucket: s3.IBucket
}

export interface IP6LzVpc {
  cidr: P6LzCidr
  myIp: P6LzMyIP
}

export interface IP6LzVpcConfig {
  cidr: P6LzCidrRaw
}

export interface IP6LzOrganizationalUnit extends OrganizationalUnit {
  Parent: string
}

export interface IP6LzAccount {
  SraType: string
  Name: string
  Email: string
  OrganizationalUnitName: string
  AccountId: string
  Vpc?: IP6LzVpcConfig
}
export type P6LzAccounts = IP6LzAccount[]
export interface IP6LzAccountsConfig {
  accounts: Record<P6LzAccountType, IP6LzAccount>
}

export interface IP6LzConfig extends IP6LzAccountsConfig {
  env: IP6LzAwsEnv
  myIp: P6LzMyIP
  principals: P6LzPrincipals
}
