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

    describe('Edge cases', () => {
      it('should fail to initialize with multiple arguments', () => {
        assert.throws(() => new Reactor({}, {}), {
          name: 'Error',
          message: 'Reactor constructor takes at most one argument'
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
  describe('Initializes wrapping a function', () => {
    it('should initialize with a function argument', () => new Observer(() => {}))

    it('should fail to initialize with no argument', () => {
      assert.throws(() => new Observer(), {
        name: 'Error',
        message: 'Observer constructor requires exactly one argument'
      })
    })

    it('should fail to initialize with multiple arguments', () => {
      assert.throws(() => new Observer(() => {}, () => {}), {
        name: 'Error',
        message: 'Observer constructor requires exactly one argument'
      })
    })

    it('should not run upon initialization', () => {
      let triggerCount = 0
      // eslint-disable-next-line no-new
      new Observer(() => { triggerCount += 1 })
      assert.strictEqual(triggerCount, 0)
    })

    it('should be an Observer object', () => {
      const observer = new Observer(() => {})
      assert(observer instanceof Observer)
    })

    describe('Fails to initialize with an argument that is not a Function', () => {
      it('should fail to initialize with a string', () => {
        assert.throws(() => new Observer('foo'), {
          name: 'TypeError',
          message: 'Cannot create observer with a non-function'
        })
      })
      it('should fail to initialize with a number', () => {
        assert.throws(() => new Observer(123), {
          name: 'TypeError',
          message: 'Cannot create observer with a non-function'
        })
      })
      it('should fail to initialize with a bigint', () => {
        assert.throws(() => new Observer(123456789123456789n), {
          name: 'TypeError',
          message: 'Cannot create observer with a non-function'
        })
      })
      it('should fail to initialize with a symbol', () => {
        assert.throws(() => new Observer(Symbol('foo')), {
          name: 'TypeError',
          message: 'Cannot create observer with a non-function'
        })
      })
      it('should fail to initialize with true', () => {
        assert.throws(() => new Observer(true), {
          name: 'TypeError',
          message: 'Cannot create observer with a non-function'
        })
      })
      it('should fail to initialize with false', () => {
        assert.throws(() => new Observer(false), {
          name: 'TypeError',
          message: 'Cannot create observer with a non-function'
        })
      })
      it('should fail to initialize with zero', () => {
        assert.throws(() => new Observer(0), {
          name: 'TypeError',
          message: 'Cannot create observer with a non-function'
        })
      })
      it('should fail to initialize with an empty string', () => {
        assert.throws(() => new Observer(''), {
          name: 'TypeError',
          message: 'Cannot create observer with a non-function'
        })
      })
      it('should fail to initialize with null', () => {
        assert.throws(() => new Observer(null), {
          name: 'TypeError',
          message: 'Cannot create observer with a non-function'
        })
      })
      it('should fail to initialize with undefined', () => {
        assert.throws(() => new Observer(undefined), {
          name: 'TypeError',
          message: 'Cannot create observer with a non-function'
        })
      })
      it('should fail to initialize with an Object', () => {
        assert.throws(() => new Observer({}), {
          name: 'TypeError',
          message: 'Cannot create observer with a non-function'
        })
      })
      it('should fail to initialize with an Array', () => {
        assert.throws(() => new Observer([]), {
          name: 'TypeError',
          message: 'Cannot create observer with a non-function'
        })
      })
    })
  })

  describe('Can be used like a normal function', () => {
    it('should be callable', () => {
      const observer = new Observer(() => {})
      observer()
    })

    it('should return the function return value', () => {
      const observer = new Observer(() => 'foo')
      assert.strictEqual(observer(), 'foo')
    })

    it('should be callable with arguments', () => {
      const observer = new Observer((a, b, c) => {
        return a + b + c
      })
      assert.strictEqual(observer('foo', 'bar', 'baz'), 'foobarbaz')
    })

    it('should have access to its arguments array', () => {
      const observer = new Observer(function () {
        let output = ''
        for (const arg of arguments) {
          output += arg
        }
        return output
      })
      assert.strictEqual(observer('foo', 'bar', 'baz'), 'foobarbaz')
    })

    it('should have access to its this context', () => {
      let context
      const object = {}
      const observer = new Observer(function () {
        context = this
      })
      object.observer = observer
      object.observer()
      assert.strictEqual(context, object)
    })

    it('should be able to use bind to create a new function with this context and arguments', () => {
      let context
      const object = { foo: 42 }
      const observer = new Observer(function (a) {
        context = this
        return this.foo + a
      })
      const boundFunction = observer.bind(object, 10)
      const result = boundFunction()
      assert.strictEqual(context, object)
      assert.strictEqual(result, 52)
    })

    it('should be able to use call to execute with specified this context and arguments', () => {
      const object = { foo: 'bar' }
      const observer = new Observer(function (a, b) {
        return this.foo + a + b
      })
      const result = observer.call(object, 'baz', 'qux')
      assert.strictEqual(result, 'barbazqux')
    })

    it('should be able to use apply to execute with specified this context and arguments', () => {
      const object = { foo: 'bar' }
      const observer = new Observer(function (a, b) {
        return this.foo + a + b
      })
      const result = observer.apply(object, ['baz', 'qux'])
      assert.strictEqual(result, 'barbazqux')
    })

    it('should be usable as a constructor', () => {
      const DummyClass = new Observer(function (arg) {
        this.foo = 'bar' + arg
        return this
      })
      const instance = new DummyClass('baz')
      assert(instance instanceof DummyClass)
      assert.strictEqual(instance.foo, 'barbaz')
    })

    it('should be a type of Function', () => {
      const observer = new Observer(() => {})
      assert(observer instanceof Function)
      assert(typeof observer === 'function')
    })
  })

  describe('Wraps returned Object values in Reactors', () => {
    it('', () => {
      const object = {}
      const observer = new Observer(() => object)
      const result = observer()
      assert(Reactors.has(result))
      assert.notStrictEqual(result, object)
      assert.strictEqual(shuck(result), object)
    })
  })

  describe('Exposes the wrapped function through execute', () => {
    it('', () => {
      const dummyFunction = function () {}
      const observer = new Observer(dummyFunction)
      assert.strictEqual(observer.execute, dummyFunction)
    })
  })

  describe('Exposes the last derived value through value', () => {
    it('should keep the last derived value for primitive values', () => {
      let counter = 0
      const dummyFunction = () => (counter += 1)
      const observer = new Observer(dummyFunction)
      let result = observer()
      assert.strictEqual(result, 1)
      assert.strictEqual(observer.value, 1)
      assert.strictEqual(result, observer.value)
      result = observer()
      assert.strictEqual(result, 2)
      assert.strictEqual(observer.value, 2)
      assert.strictEqual(result, observer.value)
    })

    it('should keep the last derived value for Object values', () => {
      let counter = 0
      const dummyFunction = () => {
        counter += 1
        return { count: counter }
      }
      const observer = new Observer(dummyFunction)
      let result = observer()
      assert.strictEqual(JSON.stringify(result), '{"count":1}')
      assert.strictEqual(JSON.stringify(observer.value), '{"count":1}')
      assert.strictEqual(result, observer.value)
      result = observer()
      assert.strictEqual(JSON.stringify(result), '{"count":2}')
      assert.strictEqual(JSON.stringify(observer.value), '{"count":2}')
      assert.strictEqual(result, observer.value)
    })
  })
})

describe('Reactivity', () => {
  describe('Observers do not trigger before being run', () => {
    it('should not trigger if reading a Signal', () => {
      let runCount = 0
      let runValue
      const signal = new Signal('foo')
      // eslint-disable-next-line no-new
      new Observer(() => {
        runCount += 1
        runValue = signal()
      })
      assert.strictEqual(runCount, 0)
      assert.strictEqual(runValue, undefined)
      assert.strictEqual(signal(), 'foo')
      signal('bar')
      assert.strictEqual(signal(), 'bar')
      assert.strictEqual(runCount, 0)
      assert.strictEqual(runValue, undefined)
    })
    it('should not trigger if reading a Reactor', () => {
      let runCount = 0
      let runValue
      const reactor = new Reactor({ foo: 'bar' })
      // eslint-disable-next-line no-new
      new Observer(() => {
        runCount += 1
        runValue = reactor.foo
      })
      assert.strictEqual(runCount, 0)
      assert.strictEqual(runValue, undefined)
      assert.strictEqual(reactor.foo, 'bar')
      reactor.foo = 'baz'
      assert.strictEqual(reactor.foo, 'baz')
      assert.strictEqual(runCount, 0)
      assert.strictEqual(runValue, undefined)
    })
  })

  describe('Observers after being run should form dependencies and trigger on their updates', () => {
    it('should be setup to trigger if reading a Signal', () => {
      let runCount = 0
      let runValue
      const signal = new Signal('foo')
      new Observer(() => {
        runCount += 1
        runValue = signal()
      })()
      assert.strictEqual(runCount, 1)
      assert.strictEqual(runValue, 'foo')
      assert.strictEqual(signal(), 'foo')
      signal('bar')
      assert.strictEqual(signal(), 'bar')
      assert.strictEqual(runCount, 2)
      assert.strictEqual(runValue, 'bar')
    })

    it('should be setup to trigger if reading a Reactor', () => {
      let runCount = 0
      let runValue
      const reactor = new Reactor({ foo: 'bar' })
      new Observer(() => {
        runCount += 1
        runValue = reactor.foo
      })()
      assert.strictEqual(runCount, 1)
      assert.strictEqual(runValue, 'bar')
      assert.strictEqual(reactor.foo, 'bar')
      reactor.foo = 'baz'
      assert.strictEqual(reactor.foo, 'baz')
      assert.strictEqual(runCount, 2)
      assert.strictEqual(runValue, 'baz')
    })

    it('should be setup to trigger if reading another Observer', () => {
      let runCount = 0
      let runValue
      const headObserver = new Observer((x) => x)
      const tailObserver = new Observer(() => {
        runCount += 1
        runValue = headObserver.value
      })
      tailObserver()
      assert.strictEqual(runCount, 1)
      assert.strictEqual(runValue, undefined)
      headObserver('foo')
      assert.strictEqual(runCount, 2)
      assert.strictEqual(runValue, 'foo')
    })
    // TODO trigger if reading another Observer via observer() instead of observer.value

    it('should be setup to trigger when using Object.keys', () => {
      let runCount = 0
      let runValue
      const reactor = new Reactor({ foo: 'bar' })
      new Observer(() => {
        runCount += 1
        runValue = Object.keys(reactor)
      })()
      assert.strictEqual(runCount, 1)
      assert.deepEqual(runValue, ['foo'])
      reactor.baz = 'qux'
      assert.strictEqual(runCount, 2)
      assert.deepEqual(runValue, ['foo', 'baz'])
    })

    it('should be setup to trigger when using the in operator', () => {
      let runCount = 0
      let runValue
      const reactor = new Reactor()
      new Observer(() => {
        runCount += 1
        runValue = ('foo' in reactor)
      })()
      assert.strictEqual(runCount, 1)
      assert.strictEqual(runValue, false)
      reactor.foo = 'bar'
      assert.strictEqual(runCount, 2)
      assert.strictEqual(runValue, true)
    })

    it('should get triggered by defineProperty', () => {
      let runCount = 0
      let runValue
      const reactor = new Reactor({
        foo: 'bar'
      })
      const observer = new Observer(() => {
        runCount += 1
        runValue = reactor.foo
      })
      assert.strictEqual(runCount, 0)
      assert.strictEqual(runValue, undefined)
      observer()
      assert.strictEqual(runCount, 1)
      assert.strictEqual(runValue, 'bar')
      Object.defineProperty(reactor, 'foo', {
        get () { return 'baz' }
      })
      assert.strictEqual(runCount, 2)
      assert.strictEqual(runValue, 'baz')
    })

    it('should get triggered by deleteProperty', () => {
      let runCount = 0
      let runValue
      const reactor = new Reactor({
        foo: 'bar'
      })
      const observer = new Observer(() => {
        runCount += 1
        runValue = reactor.foo
      })
      assert.strictEqual(runCount, 0)
      assert.strictEqual(runValue, undefined)
      observer()
      assert.strictEqual(runCount, 1)
      assert.strictEqual(runValue, 'bar')
      delete reactor.foo
      assert.strictEqual(runCount, 2)
      assert.strictEqual(runValue, undefined)
    })

    it('should be able to be triggered repeatedly', () => {
      let runCount = 0
      let runValue
      const reactor = new Reactor({
        foo: 'bar'
      })
      new Observer(() => {
        runCount += 1
        runValue = reactor.foo
      })()
      assert.strictEqual(runCount, 1)
      assert.strictEqual(runValue, 'bar')
      reactor.foo = 'baz'
      assert.strictEqual(runCount, 2)
      assert.strictEqual(runValue, 'baz')
      reactor.foo = 'qux'
      assert.strictEqual(runCount, 3)
      assert.strictEqual(runValue, 'qux')
      reactor.foo = 'moo'
      assert.strictEqual(runCount, 4)
      assert.strictEqual(runValue, 'moo')
      reactor.foo = 'mip'
      assert.strictEqual(runCount, 5)
      assert.strictEqual(runValue, 'mip')
    })
  })

  describe('Observers rebuild dependencies each time they trigger', () => {
    it('should build new dependencies on retriggers', () => {
      let runCount = 0
      let runValue
      const reactor = new Reactor({
        switch: 'foo',
        foo: 'bar',
        baz: 'qux'
      })
      const observer = new Observer(() => {
        runCount += 1
        runValue = reactor[reactor.switch]
      })
      // On initial run it should be depndent on foo and not baz
      observer()
      assert.strictEqual(runCount, 1)
      assert.strictEqual(runValue, 'bar')
      // Verify there is no dependency on baz
      reactor.baz = 'moo'
      assert.strictEqual(runCount, 1)
      assert.strictEqual(runValue, 'bar')
      // Switch sets new dependency on baz
      reactor.switch = 'baz'
      assert.strictEqual(runCount, 2)
      assert.strictEqual(runValue, 'moo')
      // Verify dependency on baz is working
      reactor.baz = 'mip'
      assert.strictEqual(runCount, 3)
      assert.strictEqual(runValue, 'mip')
    })
    it('should break old dependencies when no longer needed', () => {
      let runCount = 0
      let runValue
      const reactor = new Reactor({
        switch: 'foo',
        foo: 'bar',
        baz: 'qux'
      })
      const observer = new Observer(() => {
        runCount += 1
        runValue = reactor[reactor.switch]
      })
      observer()
      assert.strictEqual(runCount, 1)
      assert.strictEqual(runValue, 'bar')
      // Verify dependency on foo is working
      reactor.foo = 'moo'
      assert.strictEqual(runCount, 2)
      assert.strictEqual(runValue, 'moo')
      // Switch builds new dependencies
      reactor.switch = 'baz'
      assert.strictEqual(runCount, 3)
      assert.strictEqual(runValue, 'qux')
      // Verify dependency on foo is broken
      reactor.foo = 'mip'
      assert.strictEqual(runCount, 3)
      assert.strictEqual(runValue, 'qux')
    })
  })

  describe('Observers trigger on subproperty updates', () => {
    it('should trigger even if a relevant subproperty of its dependency is updated', () => {
      let runCount = 0
      let runValue
      const reactor = new Reactor({
        foo: {}
      })
      const observer = new Observer(() => {
        runCount += 1
        // Dependency is only explicitly on reactor.foo
        // But depends implicitly on all its subproperties
        runValue = JSON.stringify(reactor.foo)
      })
      assert.strictEqual(runCount, 0)
      assert.strictEqual(runValue, undefined)
      observer()
      assert.strictEqual(runCount, 1)
      assert.strictEqual(runValue, '{}')
      // This new property is relevant to the observer so should trigger
      reactor.foo.bar = 'baz'
      assert.strictEqual(runCount, 2)
      assert.strictEqual(runValue, '{"bar":"baz"}')
    })

    it('should not trigger if an irrelevant subproperty of its dependency is updated', () => {
      let runCount = 0
      let runValue
      const reactor = new Reactor({
        foo: {}
      })
      const observer = new Observer(() => {
        runCount += 1
        // Dependency is only explicitly on reactor.foo
        runValue = Array.isArray(reactor.foo)
      })
      assert.strictEqual(runCount, 0)
      assert.strictEqual(runValue, undefined)
      observer()
      assert.strictEqual(runCount, 1)
      assert.strictEqual(runValue, false)
      // The new property is irrelevant to the observer checking isArray so should not trigger
      reactor.foo.bar = 'baz'
      assert.strictEqual(runCount, 1)
      assert.strictEqual(runValue, false)
    })

    it('should trigger if a subproperty is updated when depending on it directly', () => {
      let runCount = 0
      let runValue
      const reactor = new Reactor({
        foo: {
          bar: 'baz'
        }
      })
      const observer = new Observer(() => {
        runCount += 1
        runValue = reactor.foo.bar
      })
      assert.strictEqual(runCount, 0)
      assert.strictEqual(runValue, undefined)
      observer()
      assert.strictEqual(runCount, 1)
      assert.strictEqual(runValue, 'baz')
      reactor.foo.bar = 'qux'
      assert.strictEqual(runCount, 2)
      assert.strictEqual(runValue, 'qux')
    })

    it('should trigger if a parent property is updated when depending on its subproperty', () => {
      let runCount = 0
      let runValue
      const reactor = new Reactor({
        foo: {
          bar: 'baz'
        }
      })
      const observer = new Observer(() => {
        runCount += 1
        runValue = reactor.foo.bar
      })
      assert.strictEqual(runCount, 0)
      assert.strictEqual(runValue, undefined)
      observer()
      assert.strictEqual(runCount, 1)
      assert.strictEqual(runValue, 'baz')
      // Instead of just updating bar we replace the whole object
      reactor.foo = { bar: 'qux' }
      assert.strictEqual(runCount, 2)
      assert.strictEqual(runValue, 'qux')
    })

    it('should not trigger if a sibling property of its dependency is updated', () => {
      let runCount = 0
      let runValue
      const reactor = new Reactor({
        foo: {
          bar: 'baz'
        }
      })
      const observer = new Observer(() => {
        runCount += 1
        runValue = reactor.foo.bar
      })
      assert.strictEqual(runCount, 0)
      assert.strictEqual(runValue, undefined)
      observer()
      assert.strictEqual(runCount, 1)
      assert.strictEqual(runValue, 'baz')
      // The new sibling property is irrelevant to the observer so should not trigger
      reactor.foo.qux = 'moo'
      assert.strictEqual(runCount, 1)
      assert.strictEqual(runValue, 'baz')
    })

    describe('Gets triggered by array update methods', () => {
      it('should get triggered by array index assignment', () => {
        let runCount = 0
        let runValue
        const reactor = new Reactor(['foo', 'bar'])
        const observer = new Observer(() => {
          runCount += 1
          runValue = reactor[1]
        })
        assert.strictEqual(runCount, 0)
        assert.strictEqual(runValue, undefined)
        observer()
        assert.strictEqual(runCount, 1)
        assert.strictEqual(runValue, 'bar')
        reactor[1] = 'baz'
        assert.strictEqual(runCount, 2)
        assert.strictEqual(runValue, 'baz')
        assert.deepEqual(reactor, ['foo', 'baz'])
      })

      it('should get triggered by array push', () => {
        let runCount = 0
        let runValue
        const reactor = new Reactor([])
        const observer = new Observer(() => {
          runCount += 1
          runValue = reactor[0]
        })
        assert.strictEqual(runCount, 0)
        assert.strictEqual(runValue, undefined)
        observer()
        assert.strictEqual(runCount, 1)
        assert.strictEqual(runValue, undefined)
        reactor.push('foo')
        assert.strictEqual(runCount, 2)
        assert.strictEqual(runValue, 'foo')
      })

      it('should get triggered by array pop', () => {
        let runCount = 0
        let runValue
        const reactor = new Reactor(['foo', 'bar'])
        const observer = new Observer(() => {
          runCount += 1
          runValue = reactor[reactor.length - 1]
        })
        assert.strictEqual(runCount, 0)
        assert.strictEqual(runValue, undefined)
        observer()
        assert.strictEqual(runCount, 1)
        assert.strictEqual(runValue, 'bar')
        reactor.pop()
        assert.strictEqual(runCount, 2)
        assert.strictEqual(runValue, 'foo')
        assert.strictEqual(reactor.length, 1)
      })

      it('should get triggered by array shift', () => {
        let runCount = 0
        let runValue
        const reactor = new Reactor(['foo', 'bar'])
        const observer = new Observer(() => {
          runCount += 1
          runValue = reactor[0]
        })
        assert.strictEqual(runCount, 0)
        assert.strictEqual(runValue, undefined)
        observer()
        assert.strictEqual(runCount, 1)
        assert.strictEqual(runValue, 'foo')
        reactor.shift()
        assert.strictEqual(runCount, 2)
        assert.strictEqual(runValue, 'bar')
        assert.strictEqual(reactor.length, 1)
      })

      it('should get triggered by array unshift', () => {
        let runCount = 0
        let runValue
        const reactor = new Reactor(['foo'])
        const observer = new Observer(() => {
          runCount += 1
          runValue = reactor[0]
        })
        assert.strictEqual(runCount, 0)
        assert.strictEqual(runValue, undefined)
        observer()
        assert.strictEqual(runCount, 1)
        assert.strictEqual(runValue, 'foo')
        reactor.unshift('bar')
        assert.strictEqual(runCount, 2)
        assert.strictEqual(runValue, 'bar')
        assert.strictEqual(reactor.length, 2)
      })

      it('should get triggered by array splice', () => {
        let runCount = 0
        let runValue
        const reactor = new Reactor(['foo', 'bar', 'baz'])
        const observer = new Observer(() => {
          runCount += 1
          runValue = reactor[1]
        })
        assert.strictEqual(runCount, 0)
        assert.strictEqual(runValue, undefined)
        observer()
        assert.strictEqual(runCount, 1)
        assert.strictEqual(runValue, 'bar')
        reactor.splice(1, 1, 'qux')
        assert.strictEqual(runCount, 2)
        assert.strictEqual(runValue, 'qux')
        assert.strictEqual(reactor.length, 3)
      })

      it('should get triggered by array sort', () => {
        let runCount = 0
        let runValue
        const reactor = new Reactor(['c', 'a', 'b'])
        const observer = new Observer(() => {
          runCount += 1
          runValue = reactor[0]
        })
        assert.strictEqual(runCount, 0)
        assert.strictEqual(runValue, undefined)
        observer()
        assert.strictEqual(runCount, 1)
        assert.strictEqual(runValue, 'c')
        reactor.sort()
        assert.strictEqual(runCount, 2)
        assert.strictEqual(runValue, 'a')
        assert.deepEqual(reactor, ['a', 'b', 'c'])
      })

      it('should get triggered by array reverse', () => {
        let runCount = 0
        let runValue
        const reactor = new Reactor(['a', 'b', 'c'])
        const observer = new Observer(() => {
          runCount += 1
          runValue = reactor[0]
        })
        assert.strictEqual(runCount, 0)
        assert.strictEqual(runValue, undefined)
        observer()
        assert.strictEqual(runCount, 1)
        assert.strictEqual(runValue, 'a')
        reactor.reverse()
        assert.strictEqual(runCount, 2)
        assert.strictEqual(runValue, 'c')
        assert.deepEqual(reactor, ['c', 'b', 'a'])
      })

      it('should get triggered by array fill', () => {
        let runCount = 0
        let runValue
        const reactor = new Reactor(['foo', 'bar', 'baz'])
        const observer = new Observer(() => {
          runCount += 1
          runValue = reactor[1]
        })
        assert.strictEqual(runCount, 0)
        assert.strictEqual(runValue, undefined)
        observer()
        assert.strictEqual(runCount, 1)
        assert.strictEqual(runValue, 'bar')
        reactor.fill('qux', 1, 2)
        assert.strictEqual(runCount, 2)
        assert.strictEqual(runValue, 'qux')
        assert.deepEqual(reactor, ['foo', 'qux', 'baz'])
      })

      it('should get triggered by array copyWithin', () => {
        let runCount = 0
        let runValue
        const reactor = new Reactor(['a', 'b', 'c', 'd', 'e'])
        const observer = new Observer(() => {
          runCount += 1
          runValue = reactor[2]
        })
        assert.strictEqual(runCount, 0)
        assert.strictEqual(runValue, undefined)
        observer()
        assert.strictEqual(runCount, 1)
        assert.strictEqual(runValue, 'c')
        reactor.copyWithin(2, 0, 2)
        assert.strictEqual(runCount, 2)
        assert.strictEqual(runValue, 'a')
        assert.deepEqual(reactor, ['a', 'b', 'a', 'b', 'e'])
      })

      it('should get triggered by changing the array length property', () => {
        let runCount = 0
        let runValue
        const reactor = new Reactor(['foo', 'bar'])
        const observer = new Observer(() => {
          runCount += 1
          runValue = reactor.length
        })
        assert.strictEqual(runCount, 0)
        assert.strictEqual(runValue, undefined)
        observer()
        assert.strictEqual(runCount, 1)
        assert.strictEqual(runValue, 2)
        reactor.length = 1
        assert.strictEqual(runCount, 2)
        assert.strictEqual(runValue, 1)
        assert.deepEqual(reactor, ['foo'])
      })

      it('should not get triggered by setting the array length property to its current value', () => {
        let runCount = 0
        let runValue
        const reactor = new Reactor(['foo', 'bar'])
        const observer = new Observer(() => {
          runCount += 1
          runValue = reactor.length
        })
        assert.strictEqual(runCount, 0)
        assert.strictEqual(runValue, undefined)
        observer()
        assert.strictEqual(runCount, 1)
        assert.strictEqual(runValue, 2)
        reactor.length = 2
        assert.strictEqual(runCount, 1)
        assert.strictEqual(runValue, 2)
        assert.deepEqual(reactor, ['foo', 'bar'])
      })

      it('should get triggered by array operations that change length', () => {
        let runCount = 0
        let runValue
        const reactor = new Reactor(['a', 'b', 'c'])
        const observer = new Observer(() => {
          runCount += 1
          runValue = reactor.length
        })
        assert.strictEqual(runCount, 0)
        assert.strictEqual(runValue, undefined)
        observer()
        assert.strictEqual(runCount, 1)
        assert.strictEqual(runValue, 3)

        reactor.push('d')
        assert.strictEqual(runCount, 2)
        assert.strictEqual(runValue, 4)

        reactor.pop()
        assert.strictEqual(runCount, 3)
        assert.strictEqual(runValue, 3)

        reactor.splice(0, 2)
        assert.strictEqual(runCount, 4)
        assert.strictEqual(runValue, 1)
      })

      it('should get triggered by array operations that modify existing elements', () => {
        let runCount = 0
        let runValue
        const reactor = new Reactor(['a', 'b', 'c'])
        const observer = new Observer(() => {
          runCount += 1
          runValue = reactor[1]
        })
        assert.strictEqual(runCount, 0)
        assert.strictEqual(runValue, undefined)
        observer()
        assert.strictEqual(runCount, 1)
        assert.strictEqual(runValue, 'b')

        // Modify existing element
        reactor[1] = 'x'
        assert.strictEqual(runCount, 2)
        assert.strictEqual(runValue, 'x')

        // Use splice to modify
        reactor.splice(1, 1, 'y')
        assert.strictEqual(runCount, 3)
        assert.strictEqual(runValue, 'y')

        // Use fill to modify
        reactor.fill('z', 1, 2)
        assert.strictEqual(runCount, 4)
        assert.strictEqual(runValue, 'z')
      })

      it('should be able to be triggered repeatedly by multiple array operations', () => {
        let runCount = 0
        let runValue
        const reactor = new Reactor(['a', 'b', 'c'])
        const observer = new Observer(() => {
          runCount += 1
          runValue = reactor.join(',')
        })
        assert.strictEqual(runCount, 0)
        assert.strictEqual(runValue, undefined)
        observer()
        assert.strictEqual(runCount, 1)
        assert.strictEqual(runValue, 'a,b,c')

        // Multiple operations should trigger observer multiple times
        reactor.push('d')
        assert.strictEqual(runCount, 2)
        assert.strictEqual(runValue, 'a,b,c,d')

        reactor.splice(1, 1)
        assert.strictEqual(runCount, 3)
        assert.strictEqual(runValue, 'a,c,d')

        reactor.reverse()
        assert.strictEqual(runCount, 4)
        assert.strictEqual(runValue, 'd,c,a')
      })
    })
  })

  describe('Observers are triggered only once per update ', () => {
    it('should trigger only once despite multiple identical dependencies', () => {
      let runCount = 0
      let runValue
      const reactor = new Reactor({
        foo: 'bar'
      })
      new Observer(() => {
        runCount += 1
        runValue = reactor.foo + reactor.foo + reactor.foo
      })()
      assert.strictEqual(runCount, 1)
      assert.strictEqual(runValue, 'barbarbar')
      reactor.foo = 'baz'
      assert.strictEqual(runCount, 2)
      assert.strictEqual(runValue, 'bazbazbaz')
    })
    it('should trigger only once despite multiple different dependencies', () => {
      let counter = 0
      let getTracker
      let stringifyTracker
      let valuesTracker
      const reactor = new Reactor({
        foo: 'bar'
      })
      new Observer(() => {
        counter += 1
        getTracker = reactor.foo
        stringifyTracker = JSON.stringify(reactor)
        valuesTracker = Object.values(reactor)
      })()
      assert.equal(counter, 1)
      assert.strictEqual(getTracker, 'bar')
      assert.strictEqual(stringifyTracker, '{"foo":"bar"}')
      assert.deepEqual(valuesTracker, ['bar'])
      reactor.foo = 'baz'
      assert.equal(counter, 2)
      assert.strictEqual(getTracker, 'baz')
      assert.strictEqual(stringifyTracker, '{"foo":"baz"}')
      assert.deepEqual(valuesTracker, ['baz'])
    })
    it('should trigger only once for native methods attached to the Reactor with multiple changes on itself', () => {
      let runCount = 0
      let firstTracker
      let lengthTracker
      const reactor = new Reactor([])
      new Observer(() => {
        runCount += 1
        firstTracker = reactor[0]
        lengthTracker = reactor.length
      })()
      assert.equal(runCount, 1)
      assert.equal(lengthTracker, 0)
      assert.equal(firstTracker, undefined)
      reactor.push('bar')
      assert.equal(runCount, 2)
      assert.equal(lengthTracker, 1)
      assert.equal(firstTracker, 'bar')
    })
    it('should trigger only once for custom methods attached to the Reactor with multiple changes on itself', () => {
      let runCount = 0
      let fooTracker
      let bazTracker
      const reactor = new Reactor({
        foo: 'bar',
        baz: 'qux'
      })
      new Observer(() => {
        runCount += 1
        fooTracker = reactor.foo
        bazTracker = reactor.baz
      })()
      assert.equal(runCount, 1)
      assert.equal(fooTracker, 'bar')
      assert.equal(bazTracker, 'qux')
      reactor.change = function () {
        this.foo = this.foo + 'bar'
        this.baz = this.baz + 'qux'
      }
      reactor.change()
      assert.equal(runCount, 2)
      assert.equal(fooTracker, 'barbar')
      assert.equal(bazTracker, 'quxqux')
    })
  })

  describe('Observers are not triggered when setting an identical value', () => {
    it('should not redundantly trigger on setting an identical primitive value on a Signal', () => {
      let runCount = 0
      let runValue
      const signal = new Signal('foo')
      new Observer(() => {
        runCount += 1
        runValue = signal()
      })()
      assert.strictEqual(runCount, 1)
      assert.strictEqual(runValue, 'foo')
      signal('foo')
      assert.strictEqual(runCount, 1)
      assert.strictEqual(runValue, 'foo')
    })
    it('should not redundantly trigger on setting an identical primitive value on a Reactor', () => {
      let runCount = 0
      let runValue
      const reactor = new Reactor({
        foo: 'bar'
      })
      new Observer(() => {
        runCount += 1
        runValue = reactor.foo
      })()
      assert.strictEqual(runCount, 1)
      assert.strictEqual(runValue, 'bar')
      reactor.foo = 'bar'
      assert.strictEqual(runCount, 1)
      assert.strictEqual(runValue, 'bar')
    })
    it('should not redundantly trigger on setting an identical primitive value on an Observer', () => {
      let runCount = 0
      let runValue
      const headObserver = new Observer((x) => x)
      const tailObserver = new Observer(() => {
        runCount += 1
        runValue = headObserver.value
      })
      headObserver('foo')
      tailObserver()
      assert.strictEqual(runCount, 1)
      assert.strictEqual(runValue, 'foo')
      headObserver('foo')
      assert.strictEqual(runCount, 1)
      assert.strictEqual(runValue, 'foo')
    })
    it('should not redundantly trigger on setting an identical object value', () => {
      let runCount = 0
      let runValue
      const dummyObject = {}
      const reactor = new Reactor({
        foo: dummyObject
      })
      new Observer(() => {
        runCount += 1
        runValue = reactor.foo
      })()
      assert.strictEqual(runCount, 1)
      assert.strictEqual(shuck(runValue), dummyObject)
      reactor.foo = dummyObject
      assert.strictEqual(runCount, 1)
      assert.strictEqual(shuck(runValue), dummyObject)
    })
    it('should trigger on setting a similar but different object', () => {
      let runCount = 0
      let runValue
      const dummyObject = {}
      const reactor = new Reactor({
        foo: dummyObject
      })
      new Observer(() => {
        runCount += 1
        runValue = reactor.foo
      })()
      assert.strictEqual(runCount, 1)
      assert.strictEqual(shuck(runValue), dummyObject)
      reactor.foo = {}
      assert.strictEqual(runCount, 2)
      assert.notStrictEqual(shuck(runValue), dummyObject)
    })
  })
})

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
  // TODO should batch block return the result of the block?
})

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

describe('Minor Features', () => {
  describe('Start and Stop', () => {
    it('should stop observing', () => {
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

    it('should start after stopping', () => {
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

    it('should have no effect with repeated starts', () => {
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

  describe('Context and Subscriptions', () => {
    it('should default context to undefined', () => {
      let contextChecker = 'foo'
      new Observer((context) => {
        contextChecker = context
      })()
      assert(typeof contextChecker === 'undefined')
    })

    it('should set context', () => {
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

    it('should set context with multiple params', () => {
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

    it('should set context and react to it', () => {
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

  describe('Observer redefinition', () => {
    it('should redefine an observer', () => {
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
  })
})

describe('Complex Setups', () => {
  it('should be able to chain observers off each other', () => {
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

  it.skip('should trigger observers once per write for triangle dependencies', () => {
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

  it.skip('should not trivially infinite loop when using other observers like functions', () => {
    // Trivial case
    // observer2 = observer1() + 1
    // observer2 both calls observer1 and reads its value so is dependent on it
    // So if observer1 is updated, it triggers observer2 which runs observer1 again which triggers observer 2 again
    // Thus trivially causing an infinite loop
    // Ideally what should happen is that observer2 should call observer1 but since it just retrieved its return value directly
    // should not be subject to being triggered again
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
    // This should infinite loop but it does not right now. TBD
  })

  it('should be able to create observers inside other observers', () => {
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
