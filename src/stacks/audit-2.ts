import type { Construct } from 'constructs'
import type { IAccountIds, IShareWithOrg } from '../types'
import * as cdk from 'aws-cdk-lib'
import { P6LzSraChatbot } from '../constructs/p6-lz-sra-chatbot'
import { P6LzSraConfig } from '../constructs/p6-lz-sra-config'
import { P6LzSraInspector } from '../constructs/p6-lz-sra-inspector'
import { P6LzSraSecurityhub } from '../constructs/p6-lz-sra-security-hub'
import { getCentralBucket } from '../util'

interface AuditAccountStack2Props extends cdk.StackProps, IShareWithOrg, IAccountIds {}

export class AuditAccountStack2 extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AuditAccountStack2Props) {
    super(scope, id, props)

    const bucket = getCentralBucket(this)

    new P6LzSraConfig(this, 'P6LzSraConfig', {
      principals: props.principals,
      centralBucket: bucket,
      isCentral: true,
    })

    new P6LzSraChatbot(this, 'P6LzSraChatBot')

    new P6LzSraSecurityhub(this, 'P6LzSraSecurityHub', {
      isCentral: true,
    })

    new P6LzSraInspector(this, 'P6LzSraInspector', {
      auditAccountId: props.auditAccountId,
      principals: props.principals,
    })
  }
}
