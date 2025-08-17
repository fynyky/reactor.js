/* eslint-env mocha */
import assert from 'assert'
import {
  // Signal,
  Reactor,
  Observer
  // Signals,
  // Reactors,
  // Observers,
  // signalCoreExtractor,
  // reactorCoreExtractor,
  // observerCoreExtractor,
  // hide,
  // batch,
  // shuck
} from '../src/reactor.js'

describe('Error Handling', () => {
  it('should throw an error on a write if there is an Observer throws an error', () => {
    const reactor = new Reactor({ value: 'foo' })
    new Observer(() => {
      if (reactor.value > 1) throw new Error('dummy error')
    })()
    assert.throws(() => (reactor.value = 2), {
      name: 'Error',
      message: 'dummy error'
    })
  })

  it('should throw a CompoundError if there are multiple Observer errors', () => {
    const reactor = new Reactor({ value: 1 })
    new Observer(() => {
      if (reactor.value > 1) throw new Error('dummy error 1')
    })()
    new Observer(() => {
      if (reactor.value > 1) throw new Error('dummy error 2')
    })()
    assert.throws(() => (reactor.value = 2), {
      name: 'CompoundError'
    })
  })

  it('should throw a flattened CompoundError with chained observers', () => {
    const reactor = new Reactor({
      foo: 1
    })
    // Successful passthrough to create subsequent compound errors
    new Observer(() => {
      reactor.passthrough = reactor.foo
    })()
    // Initial error failures to create an initial compound error
    new Observer(() => {
      if (reactor.foo > 1) throw new Error('primary error 1')
    })()
    new Observer(() => {
      if (reactor.foo > 1) throw new Error('primary error 2')
    })()
    // Chain off reactor.passthrough to create a subsequent compound error
    new Observer(() => {
      if (reactor.passthrough > 1) throw new Error('secondary error 1')
    })()
    new Observer(() => {
      if (reactor.passthrough > 1) throw new Error('secondary error 2')
    })()
    // Setting foo to 2 should trigger the primary error 1 and 2 and trigger the passthrough
    // The passthrough triggers secondary error 1 and 2 as well which get merged into a compound error
    // This compound error should then be merged with primary error 1 and 2
    // Instead of nesting it flattens to a single compound error with 4 causes
    assert.throws(() => (reactor.foo = 2), (error) => {
      assert.strictEqual(error.name, 'CompoundError')
      assert.strictEqual(error.cause.length, 4)
      return true
    })
  })
})
