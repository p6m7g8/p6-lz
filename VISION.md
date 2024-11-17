# References
https://docs.aws.amazon.com/prescriptive-guidance/latest/security-reference-architecture/welcome.html
https://github.com/aws-samples/aws-security-reference-architecture-examples

# LandingZone Structure
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

# Order
## Break Glass
- Management Account:
  - Stack 1:
    - Set IAM Account Alias
    - Make Org
  - Stack 2:
    - Make OU
    - Make accounts
  - CLI:
    - Set CDK Context for accountIds
    - Enable Services
    - Delegate Administrators

- Logarchive Account:
  - Stack 1:
    - Central Bucket
    - Security Lake
  - Stack 2: Local
    - Security Hub
    - GuardDuty
    - Macie
    - Config
    - Access Analyzer
    - Access Logs
    - DNS Logs
    - Flow Logs

  - Audit Account
    - Stack 1
      - Org CloudTrail
    - CLI:
      - Start Logging
    - Stack 2:
      - Security Hub
      - Inspector
      - Artifact
      - Audit Manager
      - Config Aggregator
      - Event Bridge
      - Firewall Manager
      - Lambda (response)
      - Detective
      - Private CA
    - Stack 3: Local
      - Security Hub
      - GuardDuty
      - Macie
      - Config
      - Access Analyzer

  - Network Account
    - Stack 1:
      - Route53
      - CloudFront
      - Verified Access
      - Shield
      - WAF
      - VPC Lattice [not transit gw]
      - Cert Manager
      - RAM
      - Resolver DNS
      - Network Access Analyzer
    - Stack 2: Local
  - Stack 3: Local
      - Security Hub
      - GuardDuty
      - Macie
      - Config
      - Access Analyzer

  - Shared Account
    - Stack 1:
      - Identity Center
      - Systems Manager
    - Stack 2: Local
      - Security Hub
      - GuardDuty
      - Macie
      - Config
      - Access Analyzer

  - Forensics Account
    - Stack 1:
      - Step Functions -> Lambda -> Instance -> S3
    - Stack 2: Local
      - Security Hub
      - GuardDuty
      - Macie
      - Config
      - Access Analyzer

  - Management Account:
    - Stack 3: Local
      - Security Hub
      - GuardDuty
      - Macie
      - Config
      - Access Analyzer

### Setup PIPELINE
### Setup SCP
### Connect Github Actions for LZ

## Operate

- Individual Repo PRs