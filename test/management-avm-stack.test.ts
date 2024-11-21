import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { AvmStack } from '../src/stacks/management-1-avm'

it('avm Stack includes P6LzSraAvmOus and P6LzSraAvmAccounts constructs', () => {
  const app = new cdk.App()
  const stack = new AvmStack(app, 'TestStack', { env: { account: '123456789012', region: 'us-east-1' } })

  const template = Template.fromStack(stack)

  template.resourceCountIs('AWS::CloudFormation::CustomResource', 2) // Validating both constructs are created
})
