import type { Construct } from 'constructs'
import type { LogarchiveBucketArn, ShareWithOrg } from './../types'
import * as cdk from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { P6LzSraConfig } from '../constructs/p6-lz-sra-config'

interface NetworkAccountStack2Props extends cdk.StackProps, LogarchiveBucketArn, ShareWithOrg {}

export class NetworkAccountStack2 extends cdk.Stack {
  constructor(scope: Construct, id: string, props: NetworkAccountStack2Props) {
    super(scope, id, props)

    const bucket = s3.Bucket.fromBucketArn(this, 'CentralBucket', props.centralBucketArn.toString())

    new P6LzSraConfig(this, 'P6LzSraConfig', {
      principals: props.principals,
      centralBucket: bucket,
    })
  }
}
