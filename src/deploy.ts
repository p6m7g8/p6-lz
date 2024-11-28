#!/usr/bin/env node

import * as cdk from 'aws-cdk-lib'
// import { Aspects } from 'aws-cdk-lib'
// import { AwsSolutionsChecks, HIPAASecurityChecks, NIST80053R5Checks, PCIDSS321Checks } from 'cdk-nag'
import { phase1, phase2, phase3, phase4 } from './phases'
import { loadConfig } from './util'

async function main() {
  const config = await loadConfig()

  const app = new cdk.App()
  // Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }))
  // Aspects.of(app).add(new NIST80053R5Checks({ verbose: true }))
  // Aspects.of(app).add(new PCIDSS321Checks({ verbose: true }))
  // Aspects.of(app).add(new HIPAASecurityChecks({ verbose: true }))

  phase1(app, config)
  phase2(app, config)
  phase3(app, config)
  phase4(app, config)
  app.synth()
}

main()
