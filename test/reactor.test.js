/* eslint-env mocha */
import assert from 'assert'
import {
  // Signal,
  Reactor,
  // Observer,
  // Signals,
  Reactors,
  // Observers,
  // signalCoreExtractor,
  // reactorCoreExtractor,
  // observerCoreExtractor,
  // hide,
  // batch,
  shuck
} from '../src/reactor.js'

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
