import type { Construct } from 'constructs'
import type { IP6LzShareWithOrg } from './../types'
import * as cdk from 'aws-cdk-lib'
import { P6LzSraConfig } from '../constructs/p6-lz-sra-config'
import { getCentralBucket } from '../util'

interface NetworkAccountStack2Props extends cdk.StackProps, IP6LzShareWithOrg {}

export class NetworkAccountStack2 extends cdk.Stack {
  constructor(scope: Construct, id: string, props: NetworkAccountStack2Props) {
    super(scope, id, props)

    const bucket = getCentralBucket(this)

    new P6LzSraConfig(this, 'P6LzSraConfig', {
      principals: props.principals,
      centralBucket: bucket,
    })
  }
}
