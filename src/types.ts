import type * as cdk from 'aws-cdk-lib'
import type * as s3 from 'aws-cdk-lib/aws-s3'

export interface AccountIds {
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

export interface AccountAlias {
  accountAlias: string
}

export interface ShareWithOrg {
  principals: string[]
}

export interface LogarchiveBucket {
  centralBucket: s3.IBucket
}

export interface LogarchiveBucketArn {
  centralBucketArn: cdk.Arn
}
