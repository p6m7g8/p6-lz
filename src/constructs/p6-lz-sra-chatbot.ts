import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as chatbot from 'aws-cdk-lib/aws-chatbot'
import * as sns from 'aws-cdk-lib/aws-sns'

export interface IP6LzSraChatbotProps extends cdk.StackProps {}

export class P6LzSraChatbot extends cdk.Resource {
  constructor(scope: Construct, id: string, _props?: IP6LzSraChatbotProps) {
    super(scope, id)

    const snsTopic = new sns.Topic(this, 'Topic', {
      displayName: 'p6-lz-slack-notifications',
    })
    const slackChannel = new chatbot.SlackChannelConfiguration(this, 'SlackChannel', {
      slackChannelConfigurationName: 'p6-lz-notifications',
      slackWorkspaceId: 'TMCK8D7S5',
      slackChannelId: 'C081AG7GKEJ',
    })
    slackChannel.addNotificationTopic(snsTopic)
  }
}
