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

- [x] Management Account:
  - [x] Stack 1: p6-lz-organization
    - [x] Set IAM Account Alias
    - [x] Make Org
  - [x] Stack 2: p6-lz-avm
    - [x] Make OU
    - [x] Make accounts
  - [x] CLI:
    - [x] Set CDK Context for accountIds
    - [x] Enable Services
    - [x] Delegate Administrators

- [ ] Logarchive Account:
  - [x] Stack 1: p6-lz-logarchive-1
    - [x] Set IAM Account Alias
    - [x] Central Bucket
    - [ ] Security Lake
  - [ ] Stack 2: Local
    - [ ] Security Hub
    - [ ] GuardDuty
    - [ ] Macie
    - [x] Config
    - [ ] Access Analyzer
    - [ ] Access Logs
    - [ ] DNS Logs
    - [ ] Flow Logs

  - [ ] Audit Account
    - [x] Stack 1
      - [x] Set IAM Account Alias
      - [x] Org CloudTrail
    - [x] CLI:
      - [x] Start Logging
    - [ ] Stack 2: Source of Truth
      - [ ] Security Hub
      - [ ] Inspector
      - [ ] Artifact
      - [ ] Audit Manager
      - [x] Config Aggregator
      - [ ] Event Bridge
      - [ ] Firewall Manager
      - [ ] Lambda (response)
      - [ ] Detective
      - [ ] Private CA
    - [ ] Stack 3: Local
      - [ ] Security Hub
      - [ ] GuardDuty
      - [ ] Macie
      - [x] Config
      - [ ] Access Analyzer

  - [ ] Network Account
    - [ ] Stack 1:
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
    - [ ] Stack 2: Local
      - [ ] Security Hub
      - [ ] GuardDuty
      - [ ] Macie
      - [x] Config
      - [ ] Access Analyzer

  - [ ] Shared Account
    - [ ] Stack 1:
      - [x] Set IAM Account Alias
      - [ ] Identity Center
      - [ ] Systems Manager
    - [ ] Stack 2: Local
      - [ ] Security Hub
      - [ ] GuardDuty
      - [ ] Macie
      - [x] Config
      - [ ] Access Analyzer

  - [ ] Forensics Account
    - [ ] Stack 1:
      - [x] Set IAM Account Alias
      - [ ] Step Functions -> Lambda -> Instance -> S3
    - [ ] Stack 2: Local
      - [ ] Security Hub
      - [ ] GuardDuty
      - [ ] Macie
      - [ ] Config
      - [ ] Access Analyzer

  - [ ] Management Account:
    - [ ] Stack 3: Local
      - [ ] Security Hub
      - [ ] GuardDuty
      - [ ] Macie
      - [x] Config
      - [ ] Access Analyzer

### Setup PIPELINE

- [ ] Sandbox
  - [ ] Stack 1:
    - [x] Set IAM Account Alias
  - [ ] Stack 2: Local
    - [ ] Security Hub
    - [ ] GuardDuty
    - [ ] Macie
    - [x] Config
    - [ ] Access Analyzer

- [ ] Dev
  - [ ] Stack 1:
    - [x] Set IAM Account Alias
  - [ ] Stack 2: Local
    - [ ] Security Hub
    - [ ] GuardDuty
    - [ ] Macie
    - [x] Config
    - [ ] Access Analyzer
 [ ] QA
  - [ ] Stack 1:
    - [x] Set IAM Account Alias
  - [ ] Stack 2: Local
    - [ ] Security Hub
    - [ ] GuardDuty
    - [ ] Macie
    - [x] Config
    - [ ] Access Analyzer
- [ ] Prod
  - [ ] Stack 1:
    - [x] Set IAM Account Alias
  - [ ] Stack 2: Local
    - [ ] Security Hub
    - [ ] GuardDuty
    - [ ] Macie
    - [x] Config
    - [ ] Access Analyzer

### Setup SCP

### Connect Github Actions for LZ

## Operate

- Individual Repo PRs