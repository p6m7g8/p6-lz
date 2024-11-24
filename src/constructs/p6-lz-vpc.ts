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
      maxAzs: 1,
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
    vpc.addFlowLog('p6-lz-flow-log', {
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
    })

    const eiceSg = new ec2.SecurityGroup(this, 'p6-lz-sg-eice', {
      vpc,
      allowAllOutbound: true,
    })
    eiceSg.addIngressRule(props.myIp, ec2.Port.HTTPS, 'Allow HTTPS traffic from my IP')
    eiceSg.addIngressRule(props.myIp, ec2.Port.SSH, 'Allow SSH traffic from my IP')

    const privateSubnets = vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS })
    const privateSubnet = privateSubnets.subnets.at(0)
    new ec2.CfnInstanceConnectEndpoint(this, 'p6-lz-instance-connect-endpoint', {
      subnetId: privateSubnet!.subnetId,
      securityGroupIds: [eiceSg.securityGroupId],
    })

    const sg = new ec2.SecurityGroup(this, 'p6-lz-sg-default', {
      securityGroupName: 'p6-lz-sg-default',
      vpc,
      allowAllOutbound: true,
    })
    cdk.Tags.of(sg).add('Name', 'p6-lz-sg-default')
    sg.addIngressRule(eiceSg, ec2.Port.SSH, 'Allow SSH traffic from EICE SG')
  }
}
