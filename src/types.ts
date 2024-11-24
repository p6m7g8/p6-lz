import type * as cdk from 'aws-cdk-lib'
import type { IIpAddresses, IPeer } from 'aws-cdk-lib/aws-ec2'
import type * as s3 from 'aws-cdk-lib/aws-s3'

export interface IAccountIds {
  auditAccountId: string
  devAccountId: string
  logarchiveAccountId: string
  managementAccountId: string
  networkAccountId: string
  prodAccountId: string
  qaAccountId: string
  sandboxAccountId: string
  sharedAccountId: string
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

export interface ILogarchiveBucketArn {
  centralBucketArn: cdk.Arn
}

export interface IVpc {
  cidr: IIpAddresses
  myIp: IPeer
}
