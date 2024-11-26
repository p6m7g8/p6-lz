import type { OrganizationalUnit } from '@aws-sdk/client-organizations'
import type { IIpAddresses, IPeer } from 'aws-cdk-lib/aws-ec2'
import type * as s3 from 'aws-cdk-lib/aws-s3'

export interface IAccountIds {
  auditAccountId?: string
  devAccountId?: string
  logarchiveAccountId?: string
  managementAccountId?: string
  networkAccountId?: string
  prodAccountId?: string
  qaAccountId?: string
  sandboxAccountId?: string
  sharedAccountId?: string
}

export interface IAccountAlias {
  accountAlias: string
}

export interface IShareWithOrg {
  principals: string[]
}

export interface ILogarchiveBucket {
  centralBucket: s3.IBucket
}

export interface IVpc {
  cidr: IIpAddresses
  myIp: IPeer
}

export interface IVpcConfig {
  cidr: string
}

export type OrganizationalUnits = OrganizationalUnit[]
export type MyOrganizationalUnits = MyOrganizationalUnit[]
export interface MyOrganizationalUnit extends OrganizationalUnit {
  Parent: string
}

export type AccountType =
  | 'audit'
  | 'dev'
  | 'logarchive'
  | 'management'
  | 'network'
  | 'prod'
  | 'qa'
  | 'sandbox'
  | 'shared'

export interface IAccount {
  SraType: string
  Name: string
  Email: string
  OrganizationalUnitName: string
  AccountId: string
  Vpc?: IVpcConfig
}

export interface IAccountsConfig {
  accounts: Record<AccountType, IAccount>
}

export interface ExtendedAccount extends IAccount {}
export type ExtendedAccounts = ExtendedAccount[]
