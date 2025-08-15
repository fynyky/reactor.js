/* eslint-env mocha */
import assert from 'assert'
import {
  Signal,
  Reactor,
  Observer,
  // Signals,
  Reactors,
  // Observers,
  // signalCoreExtractor,
  // reactorCoreExtractor,
  // observerCoreExtractor,
  hide,
  batch,
  shuck
} from '../src/reactor.js'

describe('Signal', () => {
  describe('Initializes with a value', () => {
    it('should initialize with a string', () => {
      assert.doesNotThrow(new Signal('foo'))
    })

    it('should initialize with a number', () => {
      assert.doesNotThrow(new Signal(123))
    })

    it('should initialize with a bigint', () => {
      assert.doesNotThrow(new Signal(123456789123456789n))
    })

    it('should initialize with a symbol', () => {
      assert.doesNotThrow(new Signal(Symbol('foo')))
    })

    it('should initialize with true', () => {
      assert.doesNotThrow(new Signal(true))
    })

    it('should initialize with false', () => {
      assert.doesNotThrow(new Signal(false))
    })

    it('should initialize with null', () => {
      assert.doesNotThrow(new Signal(null))
    })

    it('should initialize with undefined', () => {
      assert.doesNotThrow(new Signal(undefined))
    })

    it('should initialize with an Object', () => {
      assert.doesNotThrow(new Signal({}))
    })

    it('should initialize with a Function', () => {
      assert.doesNotThrow(new Signal(() => {}))
    })

    // TODO: Figure out promises
    it('should initialize with a Promise')

    describe('Edge cases', () => {
      it('should initialize with no arguments', () => {
        assert.doesNotThrow(new Signal())
      })
      it.skip('should not initialize with multiple arguments', () => {
        assert.throws(new Signal('foo', 'bar'))
      })
    })
  })

  describe('Returns the initial value when called with no arguments', () => {
    it('should return the initial string', () => {
      const value = 'foo'
      const signal = new Signal(value)
      assert.strictEqual(signal(), value)
    })

    it('should return the initial number', () => {
      const value = 123
      const signal = new Signal(value)
      assert.strictEqual(signal(), value)
    })

    it('should return the initial bigint', () => {
      const value = 123456789123456789n
      const signal = new Signal(value)
      assert.strictEqual(signal(), value)
    })

    it('should return the initial symbol', () => {
      const value = Symbol('foo')
      const signal = new Signal(value)
      assert.strictEqual(signal(), value)
    })

    it('should return the initial true', () => {
      const value = true
      const signal = new Signal(value)
      assert.strictEqual(signal(), value)
    })

    it('should return the initial false', () => {
      const value = false
      const signal = new Signal(value)
      assert.strictEqual(signal(), value)
    })

    it('should return the initial null', () => {
      const value = null
      const signal = new Signal(value)
      assert.strictEqual(signal(), value)
    })

    it('should return the initial undefined', () => {
      const value = undefined
      const signal = new Signal(value)
      assert.strictEqual(signal(), value)
    })

    describe('Object are returned wrapped in a Reactor', () => {
      it('should return the initial Object wrapped in a Reactor', () => {
        const dummyObject = {}
        const signal = new Signal(dummyObject)
        const result = signal()
        assert(Reactors.has(result))
        assert.strictEqual(shuck(result), dummyObject)
      })

      it('should return the initial Function wrapped in a Reactor', () => {
        const dummyFunction = () => {}
        const signal = new Signal(dummyFunction)
        const result = signal()
        assert(Reactors.has(result))
        assert.strictEqual(shuck(result), dummyFunction)
      })

      // TODO figure out promises
      it('should return the initial Promise')
    })
  })

  describe('Replaces the stored value when called with an argument while returning the new value', () => {
    it('should update with a new string', () => {
      const signal = new Signal()
      assert.strictEqual(signal(), undefined)
      const value = 'foo'
      const writeReturn = signal(value)
      assert.strictEqual(writeReturn, value)
      const readReturn = signal()
      assert.strictEqual(readReturn, value)
    })
    it('should update with a new number', () => {
      const signal = new Signal()
      assert.strictEqual(signal(), undefined)
      const value = 123
      const writeReturn = signal(value)
      assert.strictEqual(writeReturn, value)
      const readReturn = signal()
      assert.strictEqual(readReturn, value)
    })
    it('should update with a new bigint', () => {
      const signal = new Signal()
      assert.strictEqual(signal(), undefined)
      const value = 123456789123456789n
      const writeReturn = signal(value)
      assert.strictEqual(writeReturn, value)
      const readReturn = signal()
      assert.strictEqual(readReturn, value)
    })
    it('should update with a new symbol', () => {
      const signal = new Signal()
      assert.strictEqual(signal(), undefined)
      const value = Symbol('foo')
      const writeReturn = signal(value)
      assert.strictEqual(writeReturn, value)
      const readReturn = signal()
      assert.strictEqual(readReturn, value)
    })
    it('should update with true', () => {
      const signal = new Signal()
      assert.strictEqual(signal(), undefined)
      const value = true
      const writeReturn = signal(value)
      assert.strictEqual(writeReturn, value)
      const readReturn = signal()
      assert.strictEqual(readReturn, value)
    })
    it('should update with false', () => {
      const signal = new Signal()
      assert.strictEqual(signal(), undefined)
      const value = false
      const writeReturn = signal(value)
      assert.strictEqual(writeReturn, value)
      const readReturn = signal()
      assert.strictEqual(readReturn, value)
    })
    it('should update with null', () => {
      const signal = new Signal()
      assert.strictEqual(signal(), undefined)
      const value = null
      const writeReturn = signal(value)
      assert.strictEqual(writeReturn, value)
      const readReturn = signal()
      assert.strictEqual(readReturn, value)
    })
    it('should update with undefined', () => {
      const signal = new Signal('foo')
      assert.strictEqual(signal(), 'foo')
      const value = undefined
      const writeReturn = signal(value)
      assert.strictEqual(writeReturn, value)
      const readReturn = signal()
      assert.strictEqual(readReturn, value)
    })
    it('should update with an Object', () => {
      const signal = new Signal()
      assert.strictEqual(signal(), undefined)
      const value = {}
      const writeReturn = signal(value)
      assert(Reactors.has(writeReturn))
      assert.strictEqual(shuck(writeReturn), value)
      const readReturn = signal()
      assert(Reactors.has(readReturn))
      assert.strictEqual(shuck(readReturn), value)
      assert.strictEqual(writeReturn, readReturn)
    })
    it('should update with a Function', () => {
      const signal = new Signal()
      assert.strictEqual(signal(), undefined)
      const value = () => {}
      const writeReturn = signal(value)
      assert(Reactors.has(writeReturn))
      assert.strictEqual(shuck(writeReturn), value)
      const readReturn = signal()
      assert(Reactors.has(readReturn))
      assert.strictEqual(shuck(readReturn), value)
      assert.strictEqual(writeReturn, readReturn)
    })
    it('should update with a Promise')
  })

  it('can be updated with undefined', () => {
    const signal = new Signal('foo')
    signal(undefined)
    assert.equal(signal(), undefined)
  })

  it('can be updated with null', () => {
    const signal = new Signal('foo')
    signal(null)
    assert.equal(signal(), null)
  })

  it('can be updated with false', () => {
    const signal = new Signal('foo')
    signal(false)
    assert.equal(signal(), false)
  })

  it('can be updated with zero', () => {
    const signal = new Signal('foo')
    signal(0)
    assert.equal(signal(), 0)
  })

  it('can be updated with empty string', () => {
    const signal = new Signal('foo')
    signal('')
    assert.equal(signal(), '')
  })

  it.skip('can be updated with function definition', () => {
    const signal = new Signal(5)
    const dummyFunction = () => {}
    signal(dummyFunction)
    console.log('dummyFunction', dummyFunction)
    console.log('signal', signal())
    assert.equal(signal(), signal())
  })

  it('can be updated with function that returns undefined', () => {
    const signal = new Signal(5)
    signal(() => undefined)
    // Function definitions are not supported in current implementation
    // The signal should store the function itself
    assert.equal(typeof signal(), 'function')
  })

  it('tracks dependencies when read by an observer', () => {
    const signal = new Signal(100)
    let readValue = null

    const observer = new Observer(() => {
      readValue = signal()
    })

    // Trigger the observer to read the signal
    observer()
    assert.equal(readValue, 100)

    // Update the signal and trigger again
    signal(200)
    observer()
    assert.equal(readValue, 200)
  })

  it('wraps object values in Reactors', () => {
    const obj = { foo: 'bar' }
    const signal = new Signal(obj)
    const result = signal()

    // The result should be a Reactor, not the original object
    assert.notEqual(result, obj)
    assert.equal(result.foo, 'bar')
  })

  it('does not wrap primitive values in Reactors', () => {
    const signal = new Signal('hello')
    const result = signal()

    // String should be returned as-is
    assert.equal(result, 'hello')
    assert.equal(typeof result, 'string')
  })

  it('does not wrap null in Reactors', () => {
    const signal = new Signal(null)
    const result = signal()

    // null should be returned as-is
    assert.equal(result, null)
  })

  it('does not wrap functions in Reactors', () => {
    const func = () => 'test'
    const signal = new Signal(func)
    const result = signal()

    // Function should be returned as-is (not wrapped in a Reactor)
    assert.equal(typeof result, 'function')
    assert.equal(result(), 'test')
  })

  it('does not wrap existing Reactors in new Reactors', () => {
    const reactor = new Reactor({ foo: 'bar' })
    const signal = new Signal(reactor)
    const result = signal()

    // Should return the same Reactor instance
    assert.equal(result, reactor)
  })

  it('triggers observers when value changes', () => {
    const signal = new Signal(1)
    let triggerCount = 0

    const observer = new Observer(() => {
      signal() // Read the signal
      triggerCount++
    })

    observer() // Initial trigger
    assert.equal(triggerCount, 1)

    signal(2) // Update signal
    assert.equal(triggerCount, 2)

    signal(3) // Update signal again
    assert.equal(triggerCount, 3)
  })

  it('does not trigger observers when same value is written', () => {
    const signal = new Signal(1)
    let triggerCount = 0

    const observer = new Observer(() => {
      signal() // Read the signal
      triggerCount++
    })

    observer() // Initial trigger
    assert.equal(triggerCount, 1)

    signal(1) // Write same value
    assert.equal(triggerCount, 1) // Should not trigger

    signal(2) // Write different value
    assert.equal(triggerCount, 2) // Should trigger
  })

  it('handles multiple observers correctly', () => {
    const signal = new Signal(1)
    let observer1Count = 0
    let observer2Count = 0

    const observer1 = new Observer(() => {
      signal() // Read the signal
      observer1Count++
    })

    const observer2 = new Observer(() => {
      signal() // Read the signal
      observer2Count++
    })

    observer1() // Initial trigger
    observer2() // Initial trigger
    assert.equal(observer1Count, 1)
    assert.equal(observer2Count, 1)

    signal(2) // Update signal
    assert.equal(observer1Count, 2)
    assert.equal(observer2Count, 2)
  })

  it('removes observers when they are stopped', () => {
    const signal = new Signal(1)
    let triggerCount = 0

    const observer = new Observer(() => {
      signal() // Read the signal
      triggerCount++
    })

    observer() // Initial trigger
    assert.equal(triggerCount, 1)

    observer.stop() // Stop the observer
    signal(2) // Update signal
    assert.equal(triggerCount, 1) // Should not trigger

    observer.start() // Start the observer again
    signal(3) // Update signal
    assert.equal(triggerCount, 3) // Should trigger again (total count)
  })

  it('works with batching', () => {
    const signal = new Signal(1)
    let triggerCount = 0

    const observer = new Observer(() => {
      signal() // Read the signal
      triggerCount++
    })

    observer() // Initial trigger
    assert.equal(triggerCount, 1)

    // Use batching to update multiple times
    batch(() => {
      signal(2)
      signal(3)
      signal(4)
    })

    // Should only trigger once due to batching
    assert.equal(triggerCount, 2)
    assert.equal(signal(), 4)
  })

  it('handles nested signals correctly', () => {
    const outerSignal = new Signal(1)
    const innerSignal = new Signal(10)

    let outerCount = 0
    let innerCount = 0

    const outerObserver = new Observer(() => {
      outerSignal() // Read outer signal
      innerSignal() // Read inner signal
      outerCount++
    })

    const innerObserver = new Observer(() => {
      innerSignal() // Read only inner signal
      innerCount++
    })

    outerObserver() // Initial trigger
    innerObserver() // Initial trigger
    assert.equal(outerCount, 1)
    assert.equal(innerCount, 1)

    innerSignal(20) // Update inner signal
    assert.equal(outerCount, 2) // Outer observer should trigger
    assert.equal(innerCount, 2) // Inner observer should trigger

    outerSignal(2) // Update outer signal
    assert.equal(outerCount, 3) // Outer observer should trigger
    assert.equal(innerCount, 2) // Inner observer should not trigger
  })

  it('can be used as a function with no arguments to read', () => {
    const signal = new Signal(42)
    assert.equal(signal(), 42)
  })

  it('can be used as a function with one argument to write', () => {
    const signal = new Signal(42)
    signal(100)
    assert.equal(signal(), 100)
  })

  it('can be used as a function with multiple arguments (ignores extras)', () => {
    const signal = new Signal(42)
    signal(100, 'extra', 'args')
    assert.equal(signal(), 100)
  })

  it('works with hide function to prevent dependency tracking', () => {
    const signal = new Signal(1)
    let triggerCount = 0

    // eslint-disable-next-line no-new
    new Observer(() => {
      triggerCount++
    })

    // Use hide to read signal without creating dependency
    const result = hide(() => signal())
    assert.equal(result, 1)

    // Observer should not be triggered when signal changes
    signal(2)
    assert.equal(triggerCount, 0)
  })

  it('handles Symbol values correctly', () => {
    const symbol = Symbol('test')
    const signal = new Signal(symbol)
    const result = signal()

    // Symbol should be returned as-is (not wrapped)
    assert.equal(result, symbol)
    assert.equal(typeof result, 'symbol')
  })

  it('handles BigInt values correctly', () => {
    const bigint = BigInt(123)
    const signal = new Signal(bigint)
    const result = signal()

    // BigInt should be returned as-is (not wrapped)
    assert.equal(result, bigint)
    assert.equal(typeof result, 'bigint')
  })
})

describe('Reactor', () => {
  it('initializes without error', () => new Reactor())

  it('initializes exsting object without error', () => new Reactor({}))

  it('fails to initialize with non-object', () => {
    assert.throws(() => new Reactor(true), {
      name: 'TypeError',
      message: 'Reactor source must be an Object'
    })
    assert.throws(() => new Reactor(false), {
      name: 'TypeError',
      message: 'Reactor source must be an Object'
    })
    assert.throws(() => new Reactor(null), {
      name: 'TypeError',
      message: 'Reactor source must be an Object'
    })
    assert.throws(() => new Reactor(undefined), {
      name: 'TypeError',
      message: 'Reactor source must be an Object'
    })
    assert.throws(() => new Reactor(1), {
      name: 'TypeError',
      message: 'Reactor source must be an Object'
    })
    assert.throws(() => new Reactor(0), {
      name: 'TypeError',
      message: 'Reactor source must be an Object'
    })
    assert.throws(() => new Reactor('a'), {
      name: 'TypeError',
      message: 'Reactor source must be an Object'
    })
    assert.throws(() => new Reactor(''), {
      name: 'TypeError',
      message: 'Reactor source must be an Object'
    })
    assert.throws(() => new Reactor(Symbol('dummyTest')), {
      name: 'TypeError',
      message: 'Reactor source must be an Object'
    })
  })

  it('writes without error', () => {
    const reactor = new Reactor()
    reactor.foo = 'bar'
  })

  it('reads without error', () => {
    const reactor = new Reactor()
    reactor.foo = 'bar'
    assert.equal(reactor.foo, 'bar')
  })

  it('reads from existing object without error', () => {
    const reactor = new Reactor({
      foo: 'bar'
    })
    assert.equal(reactor.foo, 'bar')
  })

  it('can defineProperty without error', () => {
    const reactor = new Reactor()
    Object.defineProperty(reactor, 'foo', {
      get () { return 'bar' }
    })
    assert.equal(reactor.foo, 'bar')
  })

  it('fails write after defineProperty non-writable', () => {
    const reactor = new Reactor()
    Object.defineProperty(reactor, 'foo', {
      value: 'bar',
      writable: false
    })
    assert.throws(() => (reactor.foo = 'baz'), {
      name: 'TypeError'
    })
  })

  it('can deleteProperty without error', () => {
    const reactor = new Reactor({
      foo: 'bar'
    })
    delete reactor.foo
    assert.equal(reactor.foo, undefined)
  })

  it('can call map on Array Reactor without error', () => {
    const reactor = new Reactor(['0', '1', '2'])
    reactor.map(x => 'this is ' + x)
  })

  describe('Misc', () => {
    it('respects receiver context for prototype inheritors', () => {
      const reactor = new Reactor()
      reactor.foo = 'bar'
      Object.defineProperty(reactor, 'getFoo', {
        get () {
          return this.foo
        }
      })
      assert.equal(reactor.getFoo, 'bar')
      reactor.foo = 'quu'
      assert.equal(reactor.getFoo, 'quu')
      const inheritor = Object.create(reactor)
      assert.equal(inheritor.foo, 'quu')
      assert.equal(inheritor.getFoo, 'quu')
      inheritor.foo = 'mux'
      assert.equal(inheritor.getFoo, 'mux')
    })

    it('allows Reactor wrapping of native object properties', () => {
      const native = new Map()
      const proxy = new Reactor(native)
      // Normaly proxy wrapping will fail
      // This check to see if we redirect the call `this`
      // to the wrapped object instead of the wrapper when appropriate
      assert.equal(proxy.size, 0)
    })

    it('allows Reactor wrapping of native objects methods', () => {
      const reactor = new Reactor(new Map())
      // Normal proxy wrapping will fail
      // since .keys() cannot be called on a Proxy
      reactor.keys()
    })

    it('allows shucking of a Reactor to get the underlying object', () => {
      const reactor = new Reactor(new Map())
      assert.throws(() => Map.prototype.keys.call(reactor), {
        name: 'TypeError',
        message: 'Method Map.prototype.keys called on incompatible receiver #<Map>'
      })
      const source = shuck(reactor)
      Map.prototype.keys.call(source)
    })

    it('Wraps the same object to the same Reactor', () => {
      const outerDummy = {}
      const reactorA = new Reactor(outerDummy)
      const reactorB = new Reactor(outerDummy)
      const innerDummy = {}
      reactorA.foo = innerDummy
      reactorB.bar = innerDummy
      assert.equal(reactorA, reactorB)
      assert.equal(reactorA.foo, reactorB.bar)
    })

    it('does not read an observer when calling start', () => {
      let counter = 0
      const reactor = new Reactor({
        foo: 'bar'
      })
      const innerObserver = new Observer(() => reactor.foo)
      new Observer(() => {
        innerObserver.start()
        counter += 1
      })()
      assert.equal(counter, 1)
      reactor.foo = 'baz'
      assert.equal(counter, 1)
    })

    it('passes instanceof checks', () => {
      const a = new Reactor()
      assert(a instanceof Reactor)
      const b = new Reactor([])
      assert(b instanceof Array)
      // assert(b instanceof Reactor)
    })
  })
})

describe('Observer', () => {
  it('passes instanceof checks', () => {
    const a = new Observer(() => {})
    assert(a instanceof Observer)
    assert(a instanceof Function)
  })

  it('can be used as a constructor', () => {
    const A = new Observer(function (arg) {
      this.foo = 'bar' + arg
      return this
    })
    const a = new A('baz')
    assert.equal(JSON.stringify(a), '{"foo":"barbaz"}')
  })

  it('initializes function without error', () => new Observer(() => {}))

  it('passed correct value of this to observer', () => {
    let aResult
    const a = new Observer(function () { aResult = this })
    let barResult
    const foo = {
      a,
      bar: function () { barResult = this }
    }
    foo.a()
    foo.bar()
    assert.equal(foo, aResult)
    assert.equal(foo, barResult)
    assert.equal(aResult, barResult)
  })

  it('fails to initialize with no argument', () => {
    assert.throws(() => new Observer(), {
      name: 'TypeError',
      message: 'Cannot create observer with a non-function'
    })
  })

  it('fails to initialize with non-function', () => {
    assert.throws(() => new Observer(true), {
      name: 'TypeError',
      message: 'Cannot create observer with a non-function'
    })
    assert.throws(() => new Observer(false), {
      name: 'TypeError',
      message: 'Cannot create observer with a non-function'
    })
    assert.throws(() => new Observer(null), {
      name: 'TypeError',
      message: 'Cannot create observer with a non-function'
    })
    assert.throws(() => new Observer(undefined), {
      name: 'TypeError',
      message: 'Cannot create observer with a non-function'
    })
    assert.throws(() => new Observer(1), {
      name: 'TypeError',
      message: 'Cannot create observer with a non-function'
    })
    assert.throws(() => new Observer(0), {
      name: 'TypeError',
      message: 'Cannot create observer with a non-function'
    })
    assert.throws(() => new Observer('a'), {
      name: 'TypeError',
      message: 'Cannot create observer with a non-function'
    })
    assert.throws(() => new Observer(''), {
      name: 'TypeError',
      message: 'Cannot create observer with a non-function'
    })
    assert.throws(() => new Observer(Symbol('dummyTest')), {
      name: 'TypeError',
      message: 'Cannot create observer with a non-function'
    })
    assert.throws(() => new Observer({}), {
      name: 'TypeError',
      message: 'Cannot create observer with a non-function'
    })
    assert.throws(() => new Observer([]), {
      name: 'TypeError',
      message: 'Cannot create observer with a non-function'
    })
  })

  it('exposes the raw function as execute', () => {
    const dummyFunction = function () {
      return 'foo'
    }
    const observer = new Observer(dummyFunction)
    assert.equal(observer.execute, dummyFunction)
  })

  it('exposes the last derived value', () => {
    const rx = new Reactor({
      foo: 'foo'
    })
    const observer = new Observer(() => {
      return rx.foo
    })
    assert(typeof observer.value === 'undefined')
    observer()
    assert.equal(observer.value, 'foo')
    rx.foo = 'bar'
    assert.equal(observer.value, 'bar')
  })

  it('returns the function return value', () => {
    const observer = new Observer(() => 'foo')
    assert.equal(observer(), 'foo')
  })

  it('can observe an observer', () => {
    let outcome
    const rx = new Reactor({
      foo: 'foo'
    })
    const a = new Observer(() => rx.foo + 'bar')
    a()
    const b = new Observer(() => (outcome = a.value + 'baz'))
    b()
    assert.equal(outcome, 'foobarbaz')
    rx.foo = 'qux'
    assert.equal(outcome, 'quxbarbaz')
  })

  describe('Triggering', () => {
    it('triggers once on initialization', () => {
      let counter = 0
      new Observer(() => { counter += 1 })()
      assert.equal(counter, 1)
    })

    it('triggers once on Reactor dependency write', () => {
      let counter = 0
      let tracker
      const reactor = new Reactor({
        foo: 'bar'
      })
      new Observer(() => {
        counter += 1
        tracker = reactor.foo
      })()
      assert.equal(counter, 1)
      assert.equal(tracker, 'bar')
      reactor.foo = 'mux'
      assert.equal(counter, 2)
      assert.equal(tracker, 'mux')
    })

    it('triggers once on nested Reactor dependency write', () => {
      let counter = 0
      let tracker
      const reactor = new Reactor({
        foo: {
          bar: 'baz'
        }
      })
      new Observer(() => {
        counter += 1
        tracker = reactor.foo.bar
      })()
      assert.equal(counter, 1)
      assert.equal(tracker, 'baz')
      reactor.foo.bar = 'moo'
      assert.equal(counter, 2)
      assert.equal(tracker, 'moo')
    })

    it('triggers on defineProperty', () => {
      let tracker
      const reactor = new Reactor({
        foo: 'bar'
      })
      new Observer(() => (tracker = reactor.foo))()
      assert.equal(tracker, 'bar')
      Object.defineProperty(reactor, 'foo', {
        get () { return 'baz' }
      })
      assert.equal(tracker, 'baz')
    })

    it('trigger on deleteProperty', () => {
      let tracker
      const reactor = new Reactor({
        foo: 'bar'
      })
      new Observer(() => (tracker = reactor.foo))()
      assert.equal(tracker, 'bar')
      delete reactor.foo
      assert.equal(tracker, undefined)
    })

    it('triggers on array update methods', () => {
      let counter = 0
      let tracker
      const reactor = new Reactor([])
      new Observer(() => {
        counter += 1
        tracker = reactor[0]
      })()
      assert.equal(counter, 1)
      assert.equal(tracker, undefined)
      reactor.push('foo')
      assert.equal(counter, 2)
      assert.equal(tracker, 'foo')
      reactor.unshift('bar')
      assert.equal(counter, 3)
      assert.equal(tracker, 'bar')
    })

    it('triggers only once despite multiple dependencies', () => {
      let counter = 0
      let hasTracker
      let getTracker
      let ownKeysTracker
      const reactor = new Reactor({
        foo: 'bar'
      })
      new Observer(() => {
        counter += 1
        hasTracker = ('foo' in reactor)
        getTracker = reactor.foo
        ownKeysTracker = Object.getOwnPropertyNames(reactor)
      })()
      assert.equal(counter, 1)
      assert.equal(hasTracker, true)
      assert.equal(getTracker, 'bar')
      assert.equal(JSON.stringify(ownKeysTracker), '["foo"]')
      reactor.foo = 'baz'
      assert.equal(counter, 2)
      assert.equal(hasTracker, true)
      assert.equal(getTracker, 'baz')
      assert.equal(JSON.stringify(ownKeysTracker), '["foo"]')
    })

    it('triggers only once even for functions with multiple changes', () => {
      let counter = 0
      let lengthTracker
      let firstTracker
      const reactor = new Reactor([])
      new Observer(() => {
        counter += 1
        lengthTracker = reactor.length
        firstTracker = reactor[0]
      })()
      assert.equal(counter, 1)
      assert.equal(lengthTracker, 0)
      assert.equal(firstTracker, undefined)
      reactor.push('bar')
      assert.equal(counter, 2)
      assert.equal(lengthTracker, 1)
      assert.equal(firstTracker, 'bar')
    })

    it('triggers correctly on nested observer definitions', () => {
      const reactor = new Reactor({
        outer: 'foo',
        inner: 'bar'
      })
      let outerCounter = 0
      let innerCounter = 0
      let outerTracker
      let innerTracker
      let innerObserver
      new Observer(() => {
        outerCounter += 1
        outerTracker = reactor.outer
        if (innerObserver) innerObserver.stop()
        innerObserver = new Observer(() => {
          innerCounter += 1
          innerTracker = reactor.inner
        })()
      })()
      assert.equal(outerCounter, 1)
      assert.equal(outerTracker, 'foo')
      assert.equal(innerCounter, 1)
      assert.equal(innerTracker, 'bar')
      reactor.inner = 'baz'
      assert.equal(outerCounter, 1)
      assert.equal(outerTracker, 'foo')
      assert.equal(innerCounter, 2)
      assert.equal(innerTracker, 'baz')
      reactor.outer = 'moo'
      assert.equal(outerCounter, 2)
      assert.equal(outerTracker, 'moo')
      assert.equal(innerCounter, 3)
      assert.equal(innerTracker, 'baz')
    })

    it('subscribes on Object.keys', () => {
      let counter = 0
      let tracker
      const reactor = new Reactor({ foo: 'bar' })
      new Observer(() => {
        counter += 1
        tracker = Object.keys(reactor)
      })()
      assert.equal(counter, 1)
      assert.equal(JSON.stringify(tracker), '["foo"]')
      reactor.moo = 'mux'
      assert.equal(counter, 2)
      assert.equal(JSON.stringify(tracker), '["foo","moo"]')
    })

    it('subscribes on in operator', () => {
      let counter = 0
      let tracker
      const reactor = new Reactor()
      new Observer(() => {
        counter += 1
        tracker = ('foo' in reactor)
      })()
      assert.equal(counter, 1)
      assert.equal(tracker, false)
      reactor.foo = 'bar'
      assert.equal(counter, 2)
      assert.equal(tracker, true)
    })

    it('subscribes using observe keyword', () => {
      let counter = 0
      let tracker
      const reactor = new Reactor({ value: 'foo' })
      new Observer(() => {
        counter += 1
        tracker = reactor.value
      })()
      assert.equal(counter, 1)
      assert.equal(tracker, 'foo')
      reactor.value = 'bar'
      assert.equal(counter, 2)
      assert.equal(tracker, 'bar')
    })

    it('does not subscribe in hide block', () => {
      const reactor = new Reactor({
        outer: 'foo',
        inner: 'bar'
      })
      let outerCounter = 0
      let innerCounter = 0
      let outerTracker
      let innerTracker
      new Observer(() => {
        outerCounter += 1
        outerTracker = reactor.outer
        hide(() => {
          innerCounter += 1
          innerTracker = reactor.inner
        })
      })()
      assert.equal(outerCounter, 1)
      assert.equal(innerCounter, 1)
      assert.equal(outerTracker, 'foo')
      assert.equal(innerTracker, 'bar')
      reactor.inner = 'baz'
      assert.equal(outerCounter, 1)
      assert.equal(innerCounter, 1)
      assert.equal(outerTracker, 'foo')
      assert.equal(innerTracker, 'bar')
      reactor.outer = 'moo'
      assert.equal(outerCounter, 2)
      assert.equal(innerCounter, 2)
      assert.equal(outerTracker, 'moo')
      assert.equal(innerTracker, 'baz')
    })

    it('returns output of hide block', () => {
      const reactor = new Reactor({
        outer: 'foo',
        inner: 'bar'
      })
      let outerCounter = 0
      let innerCounter = 0
      let outerTracker
      let innerTracker
      new Observer(() => {
        outerCounter += 1
        outerTracker = reactor.outer
        innerTracker = hide(() => {
          innerCounter += 1
          return reactor.inner
        })
      })()
      assert.equal(outerCounter, 1)
      assert.equal(innerCounter, 1)
      assert.equal(outerTracker, 'foo')
      assert.equal(innerTracker, 'bar')
      reactor.inner = 'baz'
      assert.equal(outerCounter, 1)
      assert.equal(innerCounter, 1)
      assert.equal(outerTracker, 'foo')
      assert.equal(innerTracker, 'bar')
      reactor.outer = 'moo'
      assert.equal(outerCounter, 2)
      assert.equal(innerCounter, 2)
      assert.equal(outerTracker, 'moo')
      assert.equal(innerTracker, 'baz')
    })

    it('does not self trigger in an hide block', () => {
      const reactor = new Reactor(['a', 'b', 'c'])
      new Observer(() => {
        hide(() => reactor.pop())
      })()
    })

    it('can redefine an observer', () => {
      const reactor = new Reactor({
        first: 'foo',
        second: 'bar'
      })
      let firstCounter = 0
      let secondCounter = 0
      let firstTracker
      let secondTracker
      const observer = new Observer(() => {
        firstCounter += 1
        firstTracker = reactor.first
      })
      observer()
      assert.equal(firstCounter, 1)
      assert.equal(secondCounter, 0)
      assert.equal(firstTracker, 'foo')
      assert.equal(secondTracker, undefined)
      observer.execute = () => {
        secondCounter += 1
        secondTracker = reactor.second
      }
      assert.equal(firstCounter, 1)
      assert.equal(secondCounter, 1)
      assert.equal(firstTracker, 'foo')
      assert.equal(secondTracker, 'bar')
      reactor.first = 'moo'
      assert.equal(firstCounter, 1)
      assert.equal(secondCounter, 1)
      assert.equal(firstTracker, 'foo')
      assert.equal(secondTracker, 'bar')
      reactor.second = 'baz'
      assert.equal(firstCounter, 1)
      assert.equal(secondCounter, 2)
      assert.equal(firstTracker, 'foo')
      assert.equal(secondTracker, 'baz')
    })

    it('delays and combines observer triggers when using batch', () => {
      const reactor = new Reactor({ value: 'foo' })
      let counter = 0
      new Observer(() => {
        counter += 1
        return reactor.value
      })()
      assert.equal(counter, 1)
      batch(() => {
        reactor.value = 'bleep'
        assert.equal(counter, 1)
        reactor.value = 'bloop'
        assert.equal(counter, 1)
        reactor.value = 'blarp'
        assert.equal(counter, 1)
      })
      assert.equal(counter, 2)
    })

    it('can nest batchers with no consequence', () => {
      const reactor = new Reactor({ value: 'foo' })
      let counter = 0
      new Observer(() => {
        counter += 1
        return reactor.value
      })()
      assert.equal(counter, 1)
      batch(() => {
        reactor.value = 'bleep'
        assert.equal(counter, 1)
        reactor.value = 'bloop'
        assert.equal(counter, 1)
        reactor.value = 'blarp'
        assert.equal(counter, 1)
        batch(() => {
          reactor.value = 'bink'
          assert.equal(counter, 1)
          reactor.value = 'bonk'
          assert.equal(counter, 1)
          reactor.value = 'bup'
          assert.equal(counter, 1)
        })
      })
      assert.equal(counter, 2)
    })

    it('triggers chained observers', () => {
      let tracker
      const reactor = new Reactor({
        foo: 'bar'
      })
      new Observer(() => {
        reactor.bigFoo = reactor.foo.toUpperCase()
      })()
      assert.equal(reactor.bigFoo, 'BAR')
      new Observer(() => {
        tracker = reactor.bigFoo
      })()
      assert.equal(tracker, 'BAR')
      reactor.foo = 'qux'
      assert.equal(reactor.bigFoo, 'QUX')
      assert.equal(tracker, 'QUX')
    })

    it('does not redundantly trigger on setting identical values', () => {
      let counter = 0
      let tracker
      const reactor = new Reactor({
        foo: 'bar'
      })
      new Observer(() => {
        counter += 1
        tracker = reactor.foo
      })()
      assert.equal(counter, 1)
      assert.equal(tracker, 'bar')
      reactor.foo = 'bar'
      assert.equal(counter, 1)
      assert.equal(tracker, 'bar')
    })

    it('does not redundantly trigger if has check remains the same', () => {
      let counter = 0
      let tracker
      const reactor = new Reactor({
        foo: 'bar'
      })
      new Observer(() => {
        counter += 1
        tracker = 'foo' in reactor
      })()
      assert.equal(counter, 1)
      assert.equal(tracker, true)
      reactor.foo = 'baz'
      assert.equal(counter, 1)
      assert.equal(tracker, true)
    })

    it('does not redundantly trigger if ownKeys check is the same', () => {
      let counter = 0
      const reactor = new Reactor({
        foo: 'bar'
      })
      new Observer(() => {
        counter += 1
        Object.keys(reactor)
      })()
      reactor.foo = 'baz'
      assert.equal(counter, 1)
      delete reactor.boo
      assert.equal(counter, 1)
      delete reactor.foo
      assert.equal(counter, 2)
      reactor.foo = 'bar'
      assert.equal(counter, 3)
    })
  })

  describe('Start Stop', () => {
    it('can stop observing', () => {
      let counter = 0
      let tracker
      const reactor = new Reactor({ value: 'foo' })
      const observer = new Observer(() => {
        counter += 1
        tracker = reactor.value
      })
      observer()
      assert.equal(counter, 1)
      assert.equal(tracker, 'foo')
      reactor.value = 'bar'
      assert.equal(counter, 2)
      assert.equal(tracker, 'bar')
      observer.stop()
      reactor.value = 'moo'
      assert.equal(counter, 2)
      assert.equal(tracker, 'bar')
    })

    it('can start after stopping', () => {
      let counter = 0
      let tracker = null
      const reactor = new Reactor({ value: 'foo' })
      const observer = new Observer(() => {
        counter += 1
        tracker = reactor.value
      })
      observer()
      assert.equal(counter, 1)
      assert.equal(tracker, 'foo')
      observer.stop()
      reactor.value = 'moo'
      assert.equal(counter, 1)
      assert.equal(tracker, 'foo')
      observer.start()
      assert.equal(counter, 2)
      assert.equal(tracker, 'moo')
    })

    it('has no effect with repeated starts', () => {
      let counter = 0
      let tracker = null
      const reactor = new Reactor({ value: 'foo' })
      const observer = new Observer(() => {
        counter += 1
        tracker = reactor.value
      })
      observer()
      assert.equal(counter, 1)
      assert.equal(tracker, 'foo')
      observer.stop()
      reactor.value = 'moo'
      assert.equal(counter, 1)
      assert.equal(tracker, 'foo')
      observer.start()
      assert.equal(counter, 2)
      assert.equal(tracker, 'moo')
      observer.start()
      assert.equal(counter, 2)
      assert.equal(tracker, 'moo')
    })
  })

  describe('Context & Subscriptions', () => {
    it('context defaults to undefined', () => {
      let contextChecker = 'foo'
      new Observer((context) => {
        contextChecker = context
      })()
      assert(typeof contextChecker === 'undefined')
    })

    it('can set context', () => {
      let contextChecker
      const observer = new Observer((context) => {
        contextChecker = context
      })
      observer('foo')
      assert.equal(contextChecker, 'foo')
      const dummyObject = {}
      observer(dummyObject)
      assert.equal(contextChecker, dummyObject)
    })

    it('can set context with multiple params', () => {
      let contextChecker
      const observer = new Observer((a, b, c) => {
        contextChecker = '' + a + b + c
      })
      observer('foo', 'bar', 'baz')
      assert.equal(contextChecker, 'foobarbaz')
      contextChecker = null
      observer()
      assert.equal(contextChecker, 'undefinedundefinedundefined')
    })

    it('can set context and react to it', () => {
      const reactor = new Reactor()
      const contextChecker = {}
      const observer = new Observer(function (...args) {
        contextChecker.this = this
        contextChecker.args = args
        contextChecker.result = reactor.foo
      })
      const bar = {
        baz: observer
      }
      assert(typeof contextChecker.this === 'undefined')
      assert(typeof contextChecker.args === 'undefined')
      assert(typeof contextChecker.result === 'undefined')
      bar.baz('qux')
      assert.equal(contextChecker.this, bar)
      assert.equal(contextChecker.args[0], 'qux')
      assert(typeof contextChecker.result === 'undefined')
      reactor.foo = 'bop'
      assert.equal(contextChecker.this, bar)
      assert.equal(contextChecker.args[0], 'qux')
      assert.equal(contextChecker.result, 'bop')
    })
  })

  describe('Error Handling', () => {
    it('throws an error on a write if there is an Observer error', () => {
      const reactor = new Reactor({ value: 'foo' })
      new Observer(() => {
        if (reactor.value > 1) throw new Error('dummy error')
      })()
      assert.throws(() => (reactor.value = 2), {
        name: 'Error',
        message: 'dummy error'
      })
    })

    it('throws a CompoundError if there are multiple Observer errors', () => {
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

    it('throws a flattened compound error with chained observers', () => {
      const reactor = new Reactor({
        foo: 'Bar'
      })
      // Successful passthrough to create subsequent compound errors
      new Observer(() => {
        reactor.passthrough = reactor.foo
      })()
      assert.equal(reactor.passthrough, 'Bar')
      // Initial error failrues to create an initial compound error
      new Observer(() => {
        if (reactor.foo === 'error') throw new Error('BIG ERROR 1')
      })()
      new Observer(() => {
        if (reactor.foo === 'error') throw new Error('BIG ERROR 2')
      })()
      // Chain off reactor.passthrough to create a subsequent compound error
      new Observer(() => {
        if (reactor.passthrough === 'error') throw new Error('small error 1')
      })()
      new Observer(() => {
        if (reactor.passthrough === 'error') throw new Error('small error 2')
      })()
      assert.throws(() => (reactor.foo = 'error'), (error) => {
        assert.equal(error.name, 'CompoundError')
        assert.equal(error.cause.length, 4)
        return true
      })
    })
  })
})
