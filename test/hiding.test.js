/* eslint-env mocha */
import assert from 'assert'
import {
  // Signal,
  Reactor,
  Observer,
  // Signals,
  // Reactors,
  // Observers,
  // signalCoreExtractor,
  // reactorCoreExtractor,
  // observerCoreExtractor,
  hide
  // batch,
  // shuck
} from '../src/reactor.js'

describe('Hiding', () => {
  // TODO add test and functionality for hide parameter validation

  it('should not create dependencies inside hide block', () => {
    const reactor = new Reactor({
      outer: 'foo',
      inner: 'bar'
    })
    let outerRunCount = 0
    let innerRunCount = 0
    let outerRunValue
    let innerRunValue
    new Observer(() => {
      outerRunCount += 1
      outerRunValue = reactor.outer
      hide(() => {
        innerRunCount += 1
        innerRunValue = reactor.inner
      })
    })()
    assert.strictEqual(outerRunCount, 1)
    assert.strictEqual(innerRunCount, 1)
    assert.strictEqual(outerRunValue, 'foo')
    assert.strictEqual(innerRunValue, 'bar')
    reactor.inner = 'baz'
    assert.strictEqual(outerRunCount, 1)
    assert.strictEqual(innerRunCount, 1)
    assert.strictEqual(outerRunValue, 'foo')
    assert.strictEqual(innerRunValue, 'bar')
    reactor.outer = 'moo'
    assert.strictEqual(outerRunCount, 2)
    assert.strictEqual(innerRunCount, 2)
    assert.strictEqual(outerRunValue, 'moo')
    assert.strictEqual(innerRunValue, 'baz')
  })

  // TODO should hide blocks be nestable?

  it('should return the result of the hide block', () => {
    const reactor = new Reactor({
      outer: 'foo',
      inner: 'bar'
    })
    let outerRunCount = 0
    let innerRunCount = 0
    let outerRunValue
    let innerRunValue
    new Observer(() => {
      outerRunCount += 1
      outerRunValue = reactor.outer
      innerRunValue = hide(() => {
        innerRunCount += 1
        return reactor.inner
      })
    })()
    assert.strictEqual(outerRunCount, 1)
    assert.strictEqual(innerRunCount, 1)
    assert.strictEqual(outerRunValue, 'foo')
    assert.strictEqual(innerRunValue, 'bar')
    reactor.inner = 'baz'
    assert.strictEqual(outerRunCount, 1)
    assert.strictEqual(innerRunCount, 1)
    assert.strictEqual(outerRunValue, 'foo')
    assert.strictEqual(innerRunValue, 'bar')
    reactor.outer = 'moo'
    assert.strictEqual(outerRunCount, 2)
    assert.strictEqual(innerRunCount, 2)
    assert.strictEqual(outerRunValue, 'moo')
    assert.strictEqual(innerRunValue, 'baz')
  })

  it('should not self trigger in a hide block', () => {
    const reactor = new Reactor(['a', 'b', 'c'])
    let runCount = 0
    let runValue
    new Observer(() => {
      runCount += 1
      // pop reads the length of the object as well as changes it
      // So calling pop normally in an observer will cause a loop
      // hide allows us to call pop without creating a dependency
      runValue = hide(() => reactor.pop())
    })()
    assert.strictEqual(runCount, 1)
    assert.strictEqual(runValue, 'c')
  })
})
