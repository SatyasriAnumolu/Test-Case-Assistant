import assert from 'node:assert/strict'
import test from 'node:test'
import { getAdoWorkItemUrl } from '../src/utils/adoLinks.js'

test('builds a work item URL from organization name, project and id', () => {
  assert.equal(
    getAdoWorkItemUrl('AVEVA-VSTS', 'AppServer OMI', 100123),
    'https://dev.azure.com/AVEVA-VSTS/AppServer%20OMI/_workitems/edit/100123',
  )
})

test('accepts a full organization URL', () => {
  assert.equal(
    getAdoWorkItemUrl('https://dev.azure.com/contoso/', 'Web', '42'),
    'https://dev.azure.com/contoso/Web/_workitems/edit/42',
  )
  assert.equal(
    getAdoWorkItemUrl('https://contoso.visualstudio.com', 'Web', 7),
    'https://contoso.visualstudio.com/Web/_workitems/edit/7',
  )
})

test('returns null when any part is missing or invalid', () => {
  assert.equal(getAdoWorkItemUrl('', 'Web', 1), null)
  assert.equal(getAdoWorkItemUrl('contoso', ' ', 1), null)
  assert.equal(getAdoWorkItemUrl('contoso', 'Web', undefined), null)
  assert.equal(getAdoWorkItemUrl('contoso', 'Web', 'abc'), null)
})
