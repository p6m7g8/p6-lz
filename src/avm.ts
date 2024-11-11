import type { Account, OrganizationalUnit } from '@aws-sdk/client-organizations'
import type { Construct } from 'constructs'
import * as fs from 'node:fs'
import * as cdk from 'aws-cdk-lib'
import { CfnAccount, CfnOrganizationalUnit } from 'aws-cdk-lib/aws-organizations'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import * as yaml from 'js-yaml'

const OU_FILE = 'conf/ou.yml'
const ACCOUNTS_FILE = 'conf/accounts.yml'

type OrganizationalUnits = OrganizationalUnit[]

type MyAccount = Account & { ou: string }
type MyAccounts = MyAccount[]

function parseOUYamlFile(filePath: string): OrganizationalUnits {
  const fileContents = fs.readFileSync(filePath, 'utf8')
  const yamlData = yaml.load(fileContents) as OrganizationalUnits
  return yamlData
}

function parseAccountsYamlFile(filePath: string): MyAccounts {
  const fileContents = fs.readFileSync(filePath, 'utf8')
  const yamlData = yaml.load(fileContents) as MyAccounts
  return yamlData
}

export class AVMStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props)

    const rootOuId = ssm.StringParameter.valueForStringParameter(this, '/organization/root-ou-id')
    const organizationalUnits = parseOUYamlFile(OU_FILE)
    const ouMap: Record<string, CfnOrganizationalUnit> = {}
    organizationalUnits.forEach((organizationalUnit: OrganizationalUnit) => {
      const ou = new CfnOrganizationalUnit(this, `OU-${organizationalUnit.Name!}`, {
        name: organizationalUnit.Name!,
        parentId: rootOuId,
      })
      ouMap[organizationalUnit.Name!] = ou
    })

    const accounts = parseAccountsYamlFile(ACCOUNTS_FILE)
    accounts.forEach((account: MyAccount) => {
      const ouName = account.ou
      const ou = ouMap[ouName]
      if (!ou) {
        throw new Error(`Organizational Unit ${ouName} not found`)
      }
      new CfnAccount(this, `Account-${account.Name!}`, {
        accountName: account.Name!,
        email: account.Email!,
        parentIds: [ou.ref],
      })
    })
  }
}
