import type { Construct } from 'constructs'
import type { IVpc } from '../types'
import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'

export interface IP6LzVpcProps extends cdk.StackProps, IVpc {}

export class P6LzVpc extends cdk.Resource {
  constructor(scope: Construct, id: string, props: IP6LzVpcProps) {
    super(scope, id)

    const vpc = new ec2.Vpc(this, 'VPC', {
      ipAddresses: props.cidr,
      maxAzs: 4,
      subnetConfiguration: [
        {
          cidrMask: 20,
          name: 'Bastion',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 20,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 20,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 20,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    })

    const bastion = new ec2.BastionHostLinux(this, 'p6-lz-bastion', {
      instanceName: 'p6-lz-bastion',
      vpc,
      subnetSelection: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType: new ec2.InstanceType('t4g.nano'),
    })
    bastion.allowSshAccessFrom(props.myIp)

    const sg = new ec2.SecurityGroup(this, 'p6-lz-sg-default', {
      vpc,
      allowAllOutbound: true,
    })
    sg.addIngressRule(bastion.connections.securityGroups[0]!, ec2.Port.SSH, 'Allow SSH from Bastion Host')
    cdk.Tags.of(sg).add('Name', 'p6-lz-sg-default')
  }
}
