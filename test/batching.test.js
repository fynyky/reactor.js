/* eslint-env mocha */
import assert from 'assert'
import {
  Signal,
  Reactor,
  Observer,
  // Signals,
  // Reactors,
  // Observers,
  // signalCoreExtractor,
  // reactorCoreExtractor,
  // observerCoreExtractor,
  // hide,
  batch
  // shuck
} from '../src/reactor.js'

describe('Batching', () => {
  // TODO add test and functionality for batch parameter validation
  it('should delay and combine observer triggers within a batch block', () => {
    const reactor = new Reactor()
    let runCount = 0
    let runValue
    new Observer(() => {
      runCount += 1
      runValue = reactor.foo
    })()
    assert.strictEqual(runCount, 1)
    assert.strictEqual(runValue, undefined)
    batch(() => {
      reactor.foo = 'bleep'
      assert.strictEqual(runCount, 1)
      reactor.foo = 'bloop'
      assert.strictEqual(runCount, 1)
      reactor.foo = 'blarp'
      assert.strictEqual(runCount, 1)
    })
    assert.strictEqual(runCount, 2)
    assert.strictEqual(runValue, 'blarp')
  })

  it('should nest batch blocks with no consequence', () => {
    const reactor = new Reactor()
    let runCount = 0
    let runValue
    new Observer(() => {
      runCount += 1
      runValue = reactor.foo
    })()
    assert.strictEqual(runCount, 1)
    assert.strictEqual(runValue, undefined)
    batch(() => {
      reactor.foo = 'bleep'
      assert.strictEqual(runCount, 1)
      reactor.foo = 'bloop'
      assert.strictEqual(runCount, 1)
      reactor.foo = 'blarp'
      assert.strictEqual(runCount, 1)
      batch(() => {
        reactor.foo = 'bink'
        assert.strictEqual(runCount, 1)
        reactor.foo = 'bonk'
        assert.strictEqual(runCount, 1)
        reactor.foo = 'bup'
        assert.strictEqual(runCount, 1)
      })
    })
    assert.strictEqual(runCount, 2)
    assert.strictEqual(runValue, 'bup')
  })

  // What should happen when a batch hits an error?
  // Fail out straight away? (unsetting batcher of course)
  // Or should it collect the error and try to trigger the observers it got to so far?
  // The later might seem like a fail forward action, but it's actually more consistent
  // since the semantic we have is that writing to a signal triggers all observers synchronously
  // It is more consistent with what happens outside of the batch block
  it('should trigger dependent observers from the batch block even if there is an error', () => {
    let runCount = 0
    let runValue
    const reactor = new Reactor({ foo: 'bar' })
    new Observer(() => {
      runCount += 1
      runValue = reactor.foo
    })()
    assert.throws(() => {
      batch(() => {
        reactor.foo = 'baz'
        throw new Error('dummy error')
      })
    }, {
      name: 'Error',
      message: 'dummy error'
    })
    assert.strictEqual(runCount, 2)
    assert.strictEqual(runValue, 'baz')
  })

  // -> a -> c
  // -> b -> c
  // Used to be batch would trigger a and b together
  // which would then double trigger c
  // Ideally a batch would only trigger c once
  it('should consolidate redundant downstream triggers', () => {
    const reactor = new Reactor({
      a: 'foo',
      b: 'bar'
    })
    let runCountA = 0
    let runCountB = 0
    let runCountC = 0
    const observerA = new Observer(() => {
      runCountA += 1
      return reactor.a
    })
    observerA()
    const observerB = new Observer(() => {
      runCountB += 1
      return reactor.b
    })
    observerB()
    const observerC = new Observer(() => {
      runCountC += 1
      return observerA.value + observerB.value
    })
    observerC()
    assert.strictEqual(runCountA, 1)
    assert.strictEqual(runCountB, 1)
    assert.strictEqual(runCountC, 1)
    batch(() => {
      reactor.a = 'baz'
      reactor.b = 'qux'
    })
    assert.strictEqual(runCountA, 2)
    assert.strictEqual(runCountB, 2)
    // Without batch this would be triggered an additional time
    // Once from observerA and another time from observerB
    // With batch these are consolidated into a single trigger
    assert.strictEqual(runCountC, 2)
  })

  // -> a -> d
  // -> b -> c -> d
  // In this case you might need to trigger d twice by the discover process
  // the batch first queues up [ab]
  // then it discovers [abdc]
  // after triggering d it discovers that it needs to update c again [abdcd]
  // If we don't queue d to be be triggered again, it will have an outdated value for c
  // Anyway around it?
  it('should not skip essential downstream triggers', () => {
    const reactor = new Reactor({
      a: 'foo',
      b: 'bar'
    })
    const observerA = new Observer(() => {
      return reactor.a
    })
    observerA()
    const observerB = new Observer(() => {
      return reactor.b
    })
    observerB()
    const observerC = new Observer(() => {
      return observerB.value
    })
    observerC()
    const observerD = new Observer(() => {
      return observerA.value + observerC.value
    })
    observerD()
    assert.strictEqual(observerD.value, 'foobar')
    batch(() => {
      reactor.a = 'baz'
      reactor.b = 'qux'
    })
    assert.strictEqual(observerD.value, 'bazqux')
  })

  // foo -> a -> c
  // foo -> b -> c
  // Auto batching for signals should trigger c once
  it('should automatically batch Signal writes', () => {
    const signal = new Signal('foo')
    let runCountA = 0
    let runCountB = 0
    let runCountC = 0
    const observerA = new Observer(() => {
      runCountA += 1
      return signal() + 'A'
    })
    observerA()
    const observerB = new Observer(() => {
      runCountB += 1
      return signal() + 'B'
    })
    observerB()
    const observerC = new Observer(() => {
      runCountC += 1
      return observerA.value + observerB.value
    })
    observerC()
    assert.strictEqual(runCountA, 1)
    assert.strictEqual(runCountB, 1)
    assert.strictEqual(runCountC, 1)
    assert.strictEqual(observerA.value, 'fooA')
    assert.strictEqual(observerB.value, 'fooB')
    assert.strictEqual(observerC.value, 'fooAfooB')
    signal('bar')
    assert.strictEqual(runCountA, 2)
    assert.strictEqual(runCountB, 2)
    // If not auto batched this would be 3
    // As observerC would be trigger from both A and B
    assert.strictEqual(runCountC, 2)
    assert.strictEqual(observerA.value, 'barA')
    assert.strictEqual(observerB.value, 'barB')
    assert.strictEqual(observerC.value, 'barAbarB')
  })
  // This should be the same as Signal since Observer values are a Signal
  // But testing it anyway for completeness
  it('should automatically batch Observer writes', () => {
    const rootObserver = new Observer((x) => x)
    rootObserver('foo')
    let runCountA = 0
    let runCountB = 0
    let runCountC = 0
    const observerA = new Observer(() => {
      runCountA += 1
      return rootObserver.value + 'A'
    })
    observerA()
    const observerB = new Observer(() => {
      runCountB += 1
      return rootObserver.value + 'B'
    })
    observerB()
    const observerC = new Observer(() => {
      runCountC += 1
      return observerA.value + observerB.value
    })
    observerC()
    assert.strictEqual(runCountA, 1)
    assert.strictEqual(runCountB, 1)
    assert.strictEqual(runCountC, 1)
    assert.strictEqual(observerA.value, 'fooA')
    assert.strictEqual(observerB.value, 'fooB')
    assert.strictEqual(observerC.value, 'fooAfooB')
    rootObserver('bar')
    assert.strictEqual(runCountA, 2)
    assert.strictEqual(runCountB, 2)
    // If not auto batched this would be 3
    // As observerC would be trigger from both A and B
    assert.strictEqual(runCountC, 2)
    assert.strictEqual(observerA.value, 'barA')
    assert.strictEqual(observerB.value, 'barB')
    assert.strictEqual(observerC.value, 'barAbarB')
  })

  it('should automatically batch Reactor writes', () => {
    let runCount = 0
    const reactor = new Reactor(['foo', 'bar'])
    new Observer(() => {
      runCount += 1
      return JSON.stringify(reactor)
    })()
    assert.strictEqual(runCount, 1)
    // Call pop because it's a compound operation
    reactor.pop()
    assert.strictEqual(runCount, 2)
  })
})
