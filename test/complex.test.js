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
} from '../src/index.js'

describe('Complex Setups', () => {
  it('can chain observers off each other', () => {
    const reactor = new Reactor({
      foo: 'bar'
    })
    const firstObserver = new Observer(() => {
      return reactor.foo.toUpperCase()
    })
    firstObserver()
    assert.strictEqual(firstObserver.value, 'BAR')
    const secondObserver = new Observer(() => {
      return '!!!' + firstObserver.value + '!!!'
    })
    secondObserver()
    assert.strictEqual(secondObserver.value, '!!!BAR!!!')
    const thirdObserver = new Observer(() => {
      return secondObserver.value.toLowerCase()
    })
    thirdObserver()
    assert.strictEqual(thirdObserver.value, '!!!bar!!!')
    reactor.foo = 'baz'
    assert.strictEqual(firstObserver.value, 'BAZ')
    assert.strictEqual(secondObserver.value, '!!!BAZ!!!')
    assert.strictEqual(thirdObserver.value, '!!!baz!!!')
  })

  it.skip('triggers observers once per write for triangle dependencies', () => {
    // We have the following triangle dependency
    // reactor -> first -> second
    // reactor -> second
    // Ideally we have reactor trigger first then second
    // However, a naive depth first implementation would trigger first when in turn trigger second
    // then go back to trigger second again because it's a dependency of reactor as well
    // So we have an observer unnecessarily triggering twice off a single write
    // Right now this is the naive implementation
    let firstRunCount = 0
    let secondRunCount = 0
    const reactor = new Reactor({
      foo: 'bar'
    })
    const firstObserver = new Observer(() => {
      firstRunCount += 1
      return reactor.foo.toUpperCase()
    })
    firstObserver()
    assert.strictEqual(firstRunCount, 1)
    assert.strictEqual(firstObserver.value, 'BAR')
    const secondObserver = new Observer(() => {
      secondRunCount += 1
      return reactor.foo + firstObserver.value
    })
    secondObserver()
    assert.strictEqual(secondRunCount, 1)
    assert.strictEqual(secondObserver.value, 'barBAR')
    reactor.foo = 'baz'
    assert.strictEqual(firstRunCount, 2)
    assert.strictEqual(firstObserver.value, 'BAZ')
    assert.strictEqual(secondRunCount, 2)
    assert.strictEqual(secondObserver.value, 'bazBAZ')
  })

  it('does not trivially infinite loop when an observer calls another', () => {
    // Trivial case
    // observer2 = observer1() + 1
    // observer2 both calls observer1 and reads its value so is dependent on it
    // So if observer1 is updated, it triggers observer2 which runs observer1 again which triggers observer 2 again
    // This is guarded against because an observer breaks all dependencies when it runs
    // And a called observer sets its value before doing a read to return it
    // This means that when observer2 calls observer1, it is temporarily not a dependency while it triggers its others
    // Then immediately after restablishes its dependence on observer1
    let firstRunCount = 0
    let secondRunCount = 0
    const reactor = new Reactor({
      foo: 'bar'
    })
    // By wrapping reactor.foo in an object, everytime it triggers it generates a new value
    // This bypasses our "same value" trigger guard
    const firstObserver = new Observer(() => {
      firstRunCount += 1
      if (firstRunCount > 100) throw new Error('infinite loop')
      return [reactor.foo]
    })
    firstObserver()
    const secondObserver = new Observer(() => {
      secondRunCount += 1
      if (secondRunCount > 100) throw new Error('infinite loop')
      return firstObserver() + 1
    })
    secondObserver()
    assert.strictEqual(firstRunCount, 2)
    assert.strictEqual(secondRunCount, 1)
    assert.deepEqual(firstObserver.value, ['bar'])
    assert.strictEqual(secondObserver.value, 'bar1')
    reactor.foo = 'baz'
    assert.strictEqual(firstRunCount, 4)
    assert.strictEqual(secondRunCount, 2)
    assert.deepEqual(firstObserver.value, ['baz'])
    assert.strictEqual(secondObserver.value, 'baz1')
  })

  it.skip('does not infinite loop with three observers calling each other like functions', () => {
    // This is a more complex case
    // observer2 = observer1() + 1
    // observer3 = observer1() + observer2()
    // So observer1 triggers observer2 which triggers observer3
    // Then observer3 triggers observer2 which does not loop because it is rebuilding dependencies when it sets its value
    // But observer3 triggers observer1 which still triggers observer2 which still triggers observer3
    let firstRunCount = 0
    let secondRunCount = 0
    let thirdRunCount = 0
    const reactor = new Reactor({
      foo: 'bar'
    })
    const firstObserver = new Observer(() => {
      firstRunCount += 1
      if (firstRunCount > 100) throw new Error('infinite loop detected')
      return [reactor.foo]
    })
    firstObserver()
    const secondObserver = new Observer(() => {
      secondRunCount += 1
      if (secondRunCount > 100) throw new Error('infinite loop detected')
      return [firstObserver() + 'baz']
    })
    secondObserver()
    const thirdObserver = new Observer(() => {
      thirdRunCount += 1
      if (thirdRunCount > 100) throw new Error('infinite loop detected')
      return [firstObserver() + secondObserver()]
    })
    thirdObserver()
    // assert.strictEqual(firstRunCount, 2)
    // assert.strictEqual(secondRunCount, 1)
    // assert.deepEqual(firstObserver.value, ['bar'])
    // assert.strictEqual(secondObserver.value, 'bar1')
    // reactor.foo = 'baz'
    // assert.strictEqual(firstRunCount, 4)
    // assert.strictEqual(secondRunCount, 2)
    // assert.deepEqual(firstObserver.value, ['baz'])
    // assert.strictEqual(secondObserver.value, 'baz1')
  })

  it('can create observers inside other observers', () => {
    const reactor = new Reactor({
      outer: 'foo',
      inner: 'bar'
    })
    let outerCounter = 0
    let innerCounter = 0
    let outerTracker
    let innerTracker
    let innerObserver
    // We have an outer observer that creates an inner observer
    // The outer observer depends on reactor.outer and the inner observer
    // The inner observer depends on reactor.inner
    new Observer(() => {
      outerCounter += 1
      outerTracker = reactor.outer
      if (innerObserver) innerObserver.stop()
      innerObserver = new Observer(() => {
        innerCounter += 1
        innerTracker = reactor.inner
      })
      innerObserver()
    })()
    // The outer observer runs which creates and runs the inner observer
    // So both run once
    assert.equal(outerCounter, 1)
    assert.equal(outerTracker, 'foo')
    assert.equal(innerCounter, 1)
    assert.equal(innerTracker, 'bar')
    // This triggers the inner observer to run again
    // The outer observer is dependent on the inner observer
    // but because the inner observer doesn't have a return value
    // it stays as undefined and so does not trigger the outer observer
    reactor.inner = 'baz'
    assert.equal(outerCounter, 1)
    assert.equal(outerTracker, 'foo')
    assert.equal(innerCounter, 2)
    assert.equal(innerTracker, 'baz')
    // This triggers the outer observer which creates and runs a new inner observer
    reactor.outer = 'moo'
    assert.equal(outerCounter, 2)
    assert.equal(outerTracker, 'moo')
    assert.equal(innerCounter, 3)
    assert.equal(innerTracker, 'baz')
  })
})
