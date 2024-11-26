#!/usr/bin/env node

import * as cdk from 'aws-cdk-lib'
import { phase1, phase2, phase3, phase4 } from './phases'
import { loadConfig } from './util'

async function main() {
  const config = await loadConfig()

  const app = new cdk.App()
  phase1(app, config)
  phase2(app, config)
  phase3(app, config)
  phase4(app, config)
  app.synth()
}

main()
