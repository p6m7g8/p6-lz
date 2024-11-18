import type { Construct } from 'constructs'
import * as path from 'node:path'
import * as cdk from 'aws-cdk-lib'
import { Asset } from 'aws-cdk-lib/aws-s3-assets'
import { P6LzSraAvmAccounts } from '../constructs/p6-lz-sra-avm-accounts'
import { P6LzSraAvmOus } from '../constructs/p6-lz-sra-avm-ous'

const OU_FILE = '../../conf/ou.yml'

export class AVMStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props)

    const ouFileAsset = new Asset(this, 'OUFileAsset', {
      path: path.join(__dirname, OU_FILE),
    })

    new P6LzSraAvmOus(this, 'P6LzSraOus', {
      asset: ouFileAsset,
    })
    new P6LzSraAvmAccounts(this, 'P6LzSraAcc', {
      asset: ouFileAsset,
    })
  }
}
