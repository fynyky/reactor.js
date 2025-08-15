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
    it('should initialize with a string', () => new Signal('foo'))
    it('should initialize with a number', () => new Signal(123))
    it('should initialize with a bigint', () => new Signal(123456789123456789n))
    it('should initialize with a symbol', () => new Signal(Symbol('foo')))
    it('should initialize with true', () => new Signal(true))
    it('should initialize with false', () => new Signal(false))
    it('should initialize with zero', () => new Signal(0))
    it('should initialize with an empty string', () => new Signal(''))
    it('should initialize with null', () => new Signal(null))
    it('should initialize with undefined', () => new Signal(undefined))
    it('should initialize with an Object', () => new Signal({}))
    it('should initialize with a Function', () => new Signal(() => {}))
    it('should initialize with a Promise') // TODO: Figure out promises
    describe('Edge cases', () => {
      it('should initialize with no arguments', () => new Signal())
      it('should not initialize with multiple arguments', () => {
        assert.throws(() => new Signal('foo', 'bar'), {
          name: 'Error',
          message: 'Signal constructor takes at most one argument'
        })
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

    it('should return the initial zero', () => {
      const value = 0
      const signal = new Signal(value)
      assert.strictEqual(signal(), value)
    })

    it('should return the initial empty string', () => {
      const value = ''
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

  describe('Replaces the stored value when called with an argument and returns the new value', () => {
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

    it('should update with zero', () => {
      const signal = new Signal()
      assert.strictEqual(signal(), undefined)
      const value = 0
      const writeReturn = signal(value)
      assert.strictEqual(writeReturn, value)
      const readReturn = signal()
      assert.strictEqual(readReturn, value)
    })

    it('should update with an empty string', () => {
      const signal = new Signal()
      assert.strictEqual(signal(), undefined)
      const value = ''
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

    describe('Objects are returned wrapped in a Reactor', () => {
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

    describe('Edge cases', () => {
      it('should throw an Error when called multiple arguments', () => {
        const signal = new Signal()
        assert.throws(() => signal(1, 2), {
          name: 'Error',
          message: 'Signal objects take at most one argument for writes and zero arguments for reads'
        })
      })
    })
  })
})

describe('Reactor', () => {
  describe('Initialization', () => {
    describe('Initializes with no argument returning a new Reactor wrapped Object', () => {
      it('should initialize with no argument', () => new Reactor())
      it('should return a Reactor Object', () => {
        const reactor = new Reactor()
        assert(Reactors.has(reactor))
      })
    })

    describe('Initializes with an existing Object returning it wrapped in a Reactor', () => {
      it('should initialize with an Object', () => new Reactor({}))
      it('should initialize with an Function', () => new Reactor(() => {}))
      it('should initialize with a Promise') // TODO: Figure out promises
      it('should return a Reactor Object wrapping the original', () => {
        const object = {}
        const reactor = new Reactor(object)
        assert(Reactors.has(reactor))
        assert.notEqual(reactor, object)
        assert.strictEqual(shuck(reactor), object)
      })
      describe('Edge cases', () => {
        it('should not wrap a Reactor around an existing Reactor', () => {
          const object = {}
          const reactor = new Reactor(object)
          const reactor2 = new Reactor(reactor)
          assert(!Reactors.has(object))
          assert(Reactors.has(reactor))
          assert(Reactors.has(reactor2))
          assert.strictEqual(reactor, reactor2)
          assert.strictEqual(shuck(reactor), shuck(reactor2))
          assert.strictEqual(shuck(reactor), object)
          assert.strictEqual(shuck(reactor2), object)
        })

        it('should return the same Reactor when wrapping the same object', () => {
          const object = {}
          const reactor = new Reactor(object)
          const reactor2 = new Reactor(object)
          assert(!Reactors.has(object))
          assert(Reactors.has(reactor))
          assert(Reactors.has(reactor2))
          assert.strictEqual(reactor, reactor2)
          assert.strictEqual(shuck(reactor), shuck(reactor2))
          assert.strictEqual(shuck(reactor), object)
          assert.strictEqual(shuck(reactor2), object)
        })
      })
    })

    describe('Fails to initialize with values which are not Objects', () => {
      it('should fail to initialize with a string', () => {
        assert.throws(() => new Reactor('foo'), {
          name: 'TypeError',
          message: 'Reactor source must be an Object'
        })
      })
      it('should fail to initialize with a number', () => {
        assert.throws(() => new Reactor(123), {
          name: 'TypeError',
          message: 'Reactor source must be an Object'
        })
      })
      it('should fail to initialize with a bigint', () => {
        assert.throws(() => new Reactor(123456789123456789n), {
          name: 'TypeError',
          message: 'Reactor source must be an Object'
        })
      })
      it('should fail to initialize with a symbol', () => {
        assert.throws(() => new Reactor(Symbol('foo')), {
          name: 'TypeError',
          message: 'Reactor source must be an Object'
        })
      })
      it('should fail to initialize with true', () => {
        assert.throws(() => new Reactor(true), {
          name: 'TypeError',
          message: 'Reactor source must be an Object'
        })
      })
      it('should fail to initialize with false', () => {
        assert.throws(() => new Reactor(false), {
          name: 'TypeError',
          message: 'Reactor source must be an Object'
        })
      })
      it('should fail to initialize with zero', () => {
        assert.throws(() => new Reactor(0), {
          name: 'TypeError',
          message: 'Reactor source must be an Object'
        })
      })
      it('should fail to initialize with an empty string', () => {
        assert.throws(() => new Reactor(''), {
          name: 'TypeError',
          message: 'Reactor source must be an Object'
        })
      })
      it('should fail to initialize with null', () => {
        assert.throws(() => new Reactor(null), {
          name: 'TypeError',
          message: 'Reactor source must be an Object'
        })
      })
      it('should fail to initialize with undefined', () => {
        assert.throws(() => new Reactor(undefined), {
          name: 'TypeError',
          message: 'Reactor source must be an Object'
        })
      })
    })
  })

  describe('Reads properties from the proxied Object', () => {
    it('should return primitive values from the proxied Object', () => {
      const reactor = new Reactor({
        foo: 'bar'
      })
      assert.strictEqual(reactor.foo, 'bar')
    })
    it('should return object values from the proxied Object as a Reactor', () => {
      const dummyObject = {}
      const reactor = new Reactor({
        foo: dummyObject
      })
      const readResult = reactor.foo
      assert.notStrictEqual(dummyObject, readResult)
      assert(Reactors.has(readResult))
      assert.strictEqual(dummyObject, shuck(readResult))
    })
  })

  describe('Writes through to the proxied Object when assigning properties', () => {
    it('should write values through to the proxied Object', () => {
      const proxiedObject = {}
      const reactor = new Reactor(proxiedObject)
      reactor.foo = 'bar'
      assert.strictEqual(proxiedObject.foo, 'bar')
      assert.strictEqual(reactor.foo, 'bar')
    })

    it('should return the written values', () => {
      const proxiedObject = {}
      const reactor = new Reactor(proxiedObject)
      const writeReturn = (reactor.foo = 'bar')
      assert.strictEqual(writeReturn, 'bar')
    })

    it('should work with defineProperty', () => {
      const proxiedObject = {}
      const reactor = new Reactor(proxiedObject)
      const result = Object.defineProperty(reactor, 'foo', {
        get () { return 'bar' }
      })
      assert.strictEqual(proxiedObject.foo, 'bar')
      assert.strictEqual(reactor.foo, 'bar')
      assert.strictEqual(result, reactor)
    })

    it('should not be writable if defineProperty sets writable to false', () => {
      const reactor = new Reactor()
      Object.defineProperty(reactor, 'foo', {
        value: 'bar',
        writable: false
      })
      assert.strictEqual(reactor.foo, 'bar')
      assert.throws(() => {
        reactor.foo = 'baz'
      }, {
        name: 'TypeError',
        message: "Cannot assign to read only property 'foo' of object '#<Reactor>'"
      })
    })

    it('should delete properties from the proxied Object', () => {
      const proxiedObject = { foo: 'bar' }
      const reactor = new Reactor(proxiedObject)
      delete reactor.foo
      assert.equal(proxiedObject.foo, undefined)
      assert.equal(reactor.foo, undefined)
    })
  })

  describe('Works with native object properties and methods', () => {
    it('should work with Array map', () => {
      const reactor = new Reactor(['0', '1', '2'])
      const result = reactor.map(x => 'this is ' + x)
      assert.deepStrictEqual(result, ['this is 0', 'this is 1', 'this is 2'])
    })

    it('should be able to read native properties', () => {
      const map = new Map()
      const reactor = new Reactor(map)
      // Normaly proxy wrapping will fail
      // This check to see if we redirect the call `this`
      // to the wrapped object instead of the wrapper when appropriate
      assert.strictEqual(reactor.size, 0)
      map.set('foo', 'bar')
      assert.strictEqual(reactor.size, 1)
    })

    it('should be able to call native objects methods', () => {
      const reactor = new Reactor(new Map())
      // Normal proxy wrapping will fail
      // since .keys() cannot be called on a Proxy
      const result = reactor.keys()
      assert(typeof result[Symbol.iterator] === 'function')
    })
  })

  describe('Misc', () => {
    it('should maintain instanceof checks for the wrapped object', () => {
      const reactor = new Reactor([])
      assert(reactor instanceof Array)
      // Sadly no way to also pass instanceof Reactor while maintaining the original instanceof checks
      // An object can only have one class inheritance chain
      // Would be great if we had some sort of in
    })

    it('should pass instanceof Reactor if no object was provided', () => {
      const reactor = new Reactor()
      assert(reactor instanceof Reactor)
    })

    it('should respect receiver this context for prototype inheritors', () => {
      const reactor = new Reactor()
      reactor.foo = 'bar'
      Object.defineProperty(reactor, 'getFoo', {
        get () {
          return this.foo
        }
      })
      const inheritor = Object.create(reactor)
      assert.strictEqual(inheritor.getFoo, 'bar')
      // The inheritor is still using its inherited getter
      // But it is being executed with the inheritor as `this`
      // So it should return the inheritor's foo property instead of the original
      inheritor.foo = 'qux'
      assert.strictEqual(inheritor.getFoo, 'qux')
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

describe('Triggering', () => {

})

describe('Misc', () => {
  it('allows shucking of a Reactor to get the underlying object', () => {
    const reactor = new Reactor(new Map())
    assert.throws(() => Map.prototype.keys.call(reactor), {
      name: 'TypeError',
      message: 'Method Map.prototype.keys called on incompatible receiver #<Map>'
    })
    const source = shuck(reactor)
    Map.prototype.keys.call(source)
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
})
