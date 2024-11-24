import type { Construct } from 'constructs'
import type { IAccountAlias, IShareWithOrg } from '../types'
import * as cdk from 'aws-cdk-lib'
import { P6CDKNamer } from 'p6-cdk-namer'
import { P6LzSraCentralBucket } from '../constructs/p6-lz-sra-central-bucket'

interface LogarchiveAccountStack1Props extends cdk.StackProps, IAccountAlias, IShareWithOrg {}

export class LogarchiveAccountStack1 extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LogarchiveAccountStack1Props) {
    super(scope, id, props)

    new P6CDKNamer(this, 'P6LzCdkNamer', {
      accountAlias: props.accountAlias,
    })

    new P6LzSraCentralBucket(this, 'P6LzSraCentralBucket', {
      principals: props.principals,
    })
  }
}
