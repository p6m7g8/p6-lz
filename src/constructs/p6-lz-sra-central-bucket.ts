import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as kms from 'aws-cdk-lib/aws-kms'
import * as s3 from 'aws-cdk-lib/aws-s3'

export interface IP6LzSraCentralBucketProps {
  principals: iam.IPrincipal[]
}

export class P6LzSraCentralBucket extends cdk.Resource {
  constructor(scope: Construct, id: string, props: IP6LzSraCentralBucketProps) {
    super(scope, id)

    const key = new kms.Key(this, 'Key', {
      alias: 'p6/lz/sra/central-bucket',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    const bucket = new s3.Bucket(this, 'Bucket', {
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: key,
      enforceSSL: true,
      intelligentTieringConfigurations: [
        {
          name: 'p6-lz-s3-it-std',
          archiveAccessTierTime: cdk.Duration.days(90),
          deepArchiveAccessTierTime: cdk.Duration.days(180),
        },
      ],
      publicReadAccess: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      versioned: true,
    })

    bucket.addToResourcePolicy(new iam.PolicyStatement({
      resources: [bucket.bucketArn],
      actions: ['s3:GetBucketAcl'],
      principals: props.principals,
    }))

    bucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:PutObject'],
      principals: props.principals,
      resources: [bucket.arnForObjects('*')],
      conditions: {
        StringEquals:
                {
                  's3:x-amz-acl': 'bucket-owner-full-control',
                },
      },
    }))
  }
}
