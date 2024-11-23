# P6's POSIX.2: p6-lz

## Table of Contents

## Badges

[![License](https://img.shields.io/badge/License-Apache%202.0-yellowgreen.svg)](https://opensource.org/licenses/Apache-2.0)
[![Mergify](https://img.shields.io/endpoint.svg?url=https://gh.mergify.io/badges//p6-lz/&style=flat)](https://mergify.io)
[![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](<https://gitpod.io/#https://github.com//p6-lz>)

## Summary

## Contributing

- [How to Contribute](<https://github.com//.github/blob/main/CONTRIBUTING.md>)

## Code of Conduct

- [Code of Conduct](<https://github.com//.github/blob/main/CODE_OF_CONDUCT.md>)

## Usage

### Aliases

### Functions

## Hierarchy

```text
.
├── README.md
├── VISION.md
├── bin
│   └── p6lzctl
├── cdk.context.json
├── cdk.json
├── conf
│   ├── accounts.yml
│   └── ou.yml
├── eslint.config.mjs
├── jest.config.js
├── package.json
├── pnpm-lock.yaml
├── src
│   ├── constructs
│   │   ├── p6-lz-sra-avm-accounts.ts
│   │   ├── p6-lz-sra-avm-ous.ts
│   │   ├── p6-lz-sra-central-bucket.ts
│   │   ├── p6-lz-sra-chatbot.ts
│   │   ├── p6-lz-sra-cloudwatch.ts
│   │   ├── p6-lz-sra-config.ts
│   │   ├── p6-lz-sra-org-trail.ts
│   │   └── p6-lz-sra-security-hub.ts
│   ├── deploy.ts
│   ├── resources
│   │   ├── avm.AccountsMaker.ts
│   │   ├── avm.OUMaker.ts
│   │   ├── types.ts
│   │   └── util.ts
│   ├── stacks
│   │   ├── audit-1.ts
│   │   ├── audit-2.ts
│   │   ├── audit-3.ts
│   │   ├── dev.ts
│   │   ├── logarchive-1.ts
│   │   ├── logarchive-2.ts
│   │   ├── management-1-avm.ts
│   │   ├── management-1-organization.ts
│   │   ├── management-3.ts
│   │   ├── network-1.ts
│   │   ├── network-2.ts
│   │   ├── prod.ts
│   │   ├── qa.ts
│   │   ├── sandbox.ts
│   │   ├── shared-1.ts
│   │   └── shared-2.ts
│   └── types.ts
├── test
│   └── management-avm-stack.test.ts
└── tsconfig.json

8 directories, 43 files
```

## Author

Philip M . Gollucci <pgollucci@p6m7g8.com>
