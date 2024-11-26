# References

https://docs.aws.amazon.com/prescriptive-guidance/latest/security-reference-architecture/welcome.html
https://github.com/aws-samples/aws-security-reference-architecture-examples

# LandingZone Structure

```text
Root
├── Infrastructure
│   └── p6m7g8-shared
│   └── p6m7g8-network
├── Security
│   ├── p6m7g8-logarchive
│   └── p6m7g8-audit
│   └── p6m7g8-forensics
├── Suspended
├── Sandbox
│   └── p6m7g8-sandbox
└── Workloads
    ├── SDLC
    │   └── p6m7g8-dev
    │   └── p6m7g8-qa
    └── Production
        └── p6m7g8-prod
```

# Order

## Break Glass

- p6-lz-management-1-organization
  - [x] Set IAM Account Alias
  - [x] Make Org
- p6-lz-management-1-avm
  - [x] Make OU
  - [x] Make accounts
- p6-lz-logarchive-1
  - [x] Set IAM Account Alias
  - [x] Central Bucket
  - [ ] Security Lake
- p6-lz-management-2-cloudtrail
  - [x] Enable CloudTrail for Org
  - [x] Delegate CloudTrail to Audit
- p6-lz-management-2-config
  - [x] Enable Config for Org
  - [x] Delegate Config to Audit
- p6-lz-management-2-securityhub
  - [x] Enable SecurityHub for Org
  - [x] Delegate SecurityHub to Audit
- p6-lz-management-2-inspector
  - [x] Enable Inspector for Org
  - [x] Delegate Inspector to Audit
- p6-lz-logarchive-2
  - [x] Setup Config to go to Central Bucket
- p6-lz-audit-1
  - [x] Set IAM Account Alias
  - [x] CloudWatch Logs for CloudTrail
  - [x] Org CloudTrail
- CLI:
  - Start CloudTrail Logging [cdk bug]
- p6-lz-audit-2
  - [x] Config for Aggregator
  - [x] Config Aggregator
  - [x] Security Hub
  - [x] Inspector
  - [n] Artifact
  - [ ] Audit Manager
  - [ ] Event Bridge
  - [ ] Firewall Manager
  - [ ] Lambda (response)
  - [ ] Detective
  - [ ] Private CA
- p6-lz-audit-3
  - [ ] Security Hub
  - [ ] GuardDuty
  - [ ] Macie
  - [x] Config
  - [ ] Access Analyzer
- p6-lz-network-1
  - [x] Set IAM Account Alias
  - [ ] Route53
  - [ ] CloudFront
  - [ ] Verified Access
  - [ ] Shield
  - [ ] WAF
  - [ ] VPC Lattice [not transit gw]
  - [ ] Cert Manager
  - [ ] RAM
  - [ ] Resolver DNS
  - [ ] Network Access Analyzer
- p6-lz-network-2
  - [ ] Security Hub
  - [ ] GuardDuty
  - [ ] Macie
  - [x] Config
  - [ ] Access Analyzer
- p6-lz-shared-1
  - [x] Set IAM Account Alias
  - [ ] Identity Center
  - [ ] Systems Manager
- p6-lz-shared-2
  - [ ] Security Hub
  - [ ] GuardDuty
  - [ ] Macie
  - [x] Config
  - [ ] Access Analyzer
- p6-lz-management-3
  - [ ] Security Hub
  - [ ] GuardDuty
  - [ ] Macie
  - [x] Config
  - [ ] Access Analyzer
- p6-lz-sandbox
  - [x] VPC
- p6-lz-dev
  - [x] VPC
- p6-lz-qa
  - [x] VPC
- p6-lz-prod
  - [x] VPC

### Setup SCP

### Connect Github Actions for LZ

## Operate

- Individual Repo PRs