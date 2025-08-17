/* eslint-env mocha */
import assert from 'assert'
import {
  // Signal,
  // Reactor,
  Observer,
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
