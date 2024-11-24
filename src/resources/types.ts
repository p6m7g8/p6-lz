import type { Account, OrganizationalUnit } from '@aws-sdk/client-organizations'

export type ExtendedAccounts = ExtendedAccount[]
export type OrganizationalUnits = OrganizationalUnit[]
export type MyOrganizationalUnits = MyOrganizationalUnit[]

export interface MyOrganizationalUnit extends OrganizationalUnit {
  Parent: string
}

export interface ExtendedAccount extends Account {
  OrganizationalUnitName?: string
  Id?: string
  SraType?: string
}
