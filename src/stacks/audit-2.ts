import type { Construct } from 'constructs'
import type { IShareWithOrg } from '../types'
import type { ILogarchiveBucketArn } from './../types'
import * as cdk from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { P6LzSraChatbot } from '../constructs/p6-lz-sra-chatbot'
import { P6LzSraConfig } from '../constructs/p6-lz-sra-config'
import { P6LzSraSecurityhub } from '../constructs/p6-lz-sra-security-hub'

interface AuditAccountStack2Props extends cdk.StackProps, IShareWithOrg, ILogarchiveBucketArn {}

export class AuditAccountStack2 extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AuditAccountStack2Props) {
    super(scope, id, props)

    const bucket = s3.Bucket.fromBucketArn(this, 'CentralBucket', props.centralBucketArn.toString())

    new P6LzSraConfig(this, 'P6LzSraConfig', {
      principals: props.principals,
      centralBucket: bucket,
      isCentral: true,
    })

    new P6LzSraChatbot(this, 'P6LzSraChatBot')

    new P6LzSraSecurityhub(this, 'P6LzSraSecurityHub', {
      isCentral: true,
    })
  }
}
