import type { Construct } from 'constructs'
import type { AccountAlias, LogarchiveBucketArn, ShareWithOrg } from '../types'
import * as cdk from 'aws-cdk-lib'
import * as chatbot from 'aws-cdk-lib/aws-chatbot'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as sns from 'aws-cdk-lib/aws-sns'
import { P6CDKNamer } from 'p6-cdk-namer'
import { P6LzSraCloudWatch } from '../constructs/p6-lz-sra-cloudwatch'
import { P6LzSraConfig } from '../constructs/p6-lz-sra-config'
import { P6LzSraOrgTrail } from '../constructs/p6-lz-sra-org-trail'

interface AuditAccountStack1Props extends cdk.StackProps, AccountAlias, ShareWithOrg, LogarchiveBucketArn {}

export class AuditAccountStack1 extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AuditAccountStack1Props) {
    super(scope, id, props)

    new P6CDKNamer(this, 'P6CDKNamer', {
      accountAlias: 'p6m7g8-audit',
    })

    const cw = new P6LzSraCloudWatch(this, 'P6LzSraCloudWatch', {
      accountAlias: 'p6m7g8-audit',
    })

    const bucket = s3.Bucket.fromBucketArn(this, 'CentralBucket', props.centralBucketArn.toString())

    const trail = new P6LzSraOrgTrail(this, 'P6LzSraOrgTrail', {
      logGroup: cw.logGroup,
      logRole: cw.logRole,
      centralBucket: bucket,
    })
    trail.node.addDependency(cw)

    new P6LzSraConfig(this, 'P6LzSraConfig', {
      principals: props.principals,
      centralBucket: bucket,
    })

    const snsTopic = new sns.Topic(this, 'P6LzTopicSlack', {
      displayName: 'p6-lz-slack-notifications',
    })
    const slackChannel = new chatbot.SlackChannelConfiguration(this, 'MySlackChannel', {
      slackChannelConfigurationName: 'p6-lz-notifications',
      slackWorkspaceId: 'TMCK8D7S5',
      slackChannelId: 'C081AG7GKEJ',
    })
    slackChannel.addNotificationTopic(snsTopic)
  }
}
