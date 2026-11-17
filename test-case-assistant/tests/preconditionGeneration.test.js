import assert from 'node:assert/strict'
import test from 'node:test'
import { generateArtifact } from '../src/services/openaiService.js'

test('generates an expected result for each standard and scenario-specific precondition', async () => {
  const result = await generateArtifact('steps', {
    title: 'Write to Configure attributes',
    description: 'Perform a write operation on Configure attributes and verify the error message.',
  })

  assert.deepEqual(
    result.preconditions.slice(0, 4).map((item) => item.expected),
    [
      'Application Server, InTouch and Historian function correctly on the GR node.',
      'The configured Galaxy is accessible and operational.',
      'WinPlatform, AppEngine, Area, and user-defined object instances behave as expected.',
      'The deployed Galaxy processes the operation successfully without errors.',
    ],
  )
  assert.ok(result.preconditions.every((item) => item.id && item.text && item.expected))
  assert.notEqual(result.preconditions[0].expected, result.steps[0].expected)
  assert.ok(result.preconditions.some((item) =>
    item.text === 'User is authenticated and connected to the Galaxy.'
      && item.expected.includes(item.text),
  ))
  assert.ok(result.steps.every((step) => step.action && step.expected))
})

test('generates results for test-specific setup without assuming unrelated outcomes', async () => {
  const result = await generateArtifact('steps', {
    title: 'Write to the Running attribute',
    description: 'Create a $Pump template with a Boolean attribute Running.\nConfigure a $Pump template and deploy $Pump_001.\nWrite True to the Running attribute and verify the value.',
  })
  const custom = result.preconditions.find((item) => item.text.startsWith('Create a $Pump template'))

  assert.ok(custom)
  assert.equal(
    custom.expected,
    'Creation is complete for a $Pump template with a Boolean attribute Running.',
  )
  const compound = result.preconditions.find((item) => item.text.startsWith('Configure a $Pump template'))
  assert.ok(compound)
  assert.equal(compound.expected, `The following precondition is satisfied: ${compound.text}`)
})

test('does not assume deployment when deployment is under test', async () => {
  const result = await generateArtifact('steps', {
    title: 'Verify Galaxy deployment',
    description: 'Deploy the Galaxy.\nVerify the Galaxy is deployed.',
  })

  assert.deepEqual(result.preconditions.slice(0, 3).map((item) => item.text), [
    'Install Application Server, InTouch and Historian on the Galaxy Repository (GR) node.',
    'Configure the GR node and create a Galaxy.',
    'Create instances of WinPlatform, AppEngine, Area, and a user-defined object.',
  ])
  assert.ok(result.preconditions.every((item) => item.expected))
  assert.ok(result.preconditions.every((item) => item.text !== 'Deploy the Galaxy.'))
  assert.ok(result.preconditions.every((item) => item.expected !== 'The deployed Galaxy processes the operation successfully without errors.'))
  assert.ok(result.steps.some((step) => step.action.includes('Deploy the Galaxy.')))
})
