/* eslint-env mocha */
import assert from 'assert'
import {
  // Signal,
  // Reactor,
  Observer,
  // Signals,
  Reactors,
  Observers,
  // signalCoreExtractor,
  // reactorCoreExtractor,
  // observerCoreExtractor,
  // hide,
  // batch,
  shuck
} from '../src/index.js'

describe('Observer', () => {
  describe('initializes with a function and returns it wrapped in an observer', () => {
    it('initializes with a function returning it wrapped in an observer', () => {
      const func = () => {}
      const observer = new Observer(func)
      assert(Observers.has(observer))
      assert.strictEqual(shuck(observer), func)
    })

    it('throws an error when initialized with no arguments', () => {
      assert.throws(() => new Observer(), {
        name: 'Error',
        message: 'Observer constructor requires exactly one argument'
      })
    })

    it('throws an error when initialized with multiple arguments', () => {
      assert.throws(() => new Observer(() => {}, () => {}), {
        name: 'Error',
        message: 'Observer constructor requires exactly one argument'
      })
    })

    it('does not run upon initialization', () => {
      let triggerCount = 0
      // eslint-disable-next-line no-new
      new Observer(() => { triggerCount += 1 })
      assert.strictEqual(triggerCount, 0)
    })

    it('is an Observer object', () => {
      const observer = new Observer(() => {})
      assert(observer instanceof Observer)
    })

    describe('throws an error when initialized with invalid parameters', () => {
      it('throws an error when initialized with a string', () => {
        assert.throws(() => new Observer('foo'), {
          name: 'TypeError',
          message: 'Cannot create observer with a non-function'
        })
      })
      it('throws an error when initialized with a number', () => {
        assert.throws(() => new Observer(123), {
          name: 'TypeError',
          message: 'Cannot create observer with a non-function'
        })
      })
      it('throws an error when initialized with a bigint', () => {
        assert.throws(() => new Observer(123456789123456789n), {
          name: 'TypeError',
          message: 'Cannot create observer with a non-function'
        })
      })
      it('throws an error when initialized with a symbol', () => {
        assert.throws(() => new Observer(Symbol('foo')), {
          name: 'TypeError',
          message: 'Cannot create observer with a non-function'
        })
      })
      it('throws an error when initialized with true', () => {
        assert.throws(() => new Observer(true), {
          name: 'TypeError',
          message: 'Cannot create observer with a non-function'
        })
      })
      it('throws an error when initialized with false', () => {
        assert.throws(() => new Observer(false), {
          name: 'TypeError',
          message: 'Cannot create observer with a non-function'
        })
      })
      it('throws an error when initialized with zero', () => {
        assert.throws(() => new Observer(0), {
          name: 'TypeError',
          message: 'Cannot create observer with a non-function'
        })
      })
      it('throws an error when initialized with an empty string', () => {
        assert.throws(() => new Observer(''), {
          name: 'TypeError',
          message: 'Cannot create observer with a non-function'
        })
      })
      it('throws an error when initialized with null', () => {
        assert.throws(() => new Observer(null), {
          name: 'TypeError',
          message: 'Cannot create observer with a non-function'
        })
      })
      it('throws an error when initialized with undefined', () => {
        assert.throws(() => new Observer(undefined), {
          name: 'TypeError',
          message: 'Cannot create observer with a non-function'
        })
      })
      it('throws an error when initialized with a non-function object', () => {
        assert.throws(() => new Observer({}), {
          name: 'TypeError',
          message: 'Cannot create observer with a non-function'
        })
      })
      it('fails to initialize with an array', () => {
        assert.throws(() => new Observer([]), {
          name: 'TypeError',
          message: 'Cannot create observer with a non-function'
        })
      })
    })
  })

  describe('behaves the same as the wrapped function', () => {
    it('is callable', () => {
      const observer = new Observer(() => {})
      observer()
    })

    it('runs the wrapped function when called', () => {
      let runCount = 0
      const observer = new Observer(() => { runCount += 1 })
      observer()
      assert.strictEqual(runCount, 1)
    })

    it('returns the wrapped function return value', () => {
      const observer = new Observer(() => 'foo')
      assert.strictEqual(observer(), 'foo')
    })

    it('is callable with arguments', () => {
      const observer = new Observer((a, b, c) => {
        return a + b + c
      })
      assert.strictEqual(observer('foo', 'bar', 'baz'), 'foobarbaz')
    })

    it('has access to its arguments array', () => {
      const observer = new Observer(function () {
        let output = ''
        for (const arg of arguments) {
          output += arg
        }
        return output
      })
      assert.strictEqual(observer('foo', 'bar', 'baz'), 'foobarbaz')
    })

    it('has access to its this context', () => {
      let context
      const object = {
        observer: new Observer(function () {
          context = this
        })
      }
      object.observer()
      assert.strictEqual(context, object)
    })

    it('can use bind to create a new function with the specified this context and arguments', () => {
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

    it('can use call to run with the specified this context and arguments', () => {
      const object = { foo: 'bar' }
      const observer = new Observer(function (a, b) {
        return this.foo + a + b
      })
      const result = observer.call(object, 'baz', 'qux')
      assert.strictEqual(result, 'barbazqux')
    })

    it('can use apply to run with the specified this context and arguments', () => {
      const object = { foo: 'bar' }
      const observer = new Observer(function (a, b) {
        return this.foo + a + b
      })
      const result = observer.apply(object, ['baz', 'qux'])
      assert.strictEqual(result, 'barbazqux')
    })

    it('can be used as a constructor', () => {
      const DummyClass = new Observer(function (arg) {
        this.foo = 'bar' + arg
        return this
      })
      const instance = new DummyClass('baz')
      assert(instance instanceof DummyClass)
      assert.strictEqual(instance.foo, 'barbaz')
    })

    it('is an instance of Function', () => {
      const observer = new Observer(() => {})
      assert(observer instanceof Function)
      assert(typeof observer === 'function')
    })
  })

  describe('returns object values wrapped in a reactor', () => {
    it('', () => {
      const object = {}
      const observer = new Observer(() => object)
      const result = observer()
      assert(Reactors.has(result))
      assert.notStrictEqual(result, object)
      assert.strictEqual(shuck(result), object)
    })
  })

  describe('exposes the wrapped function through the execute property', () => {
    it('', () => {
      const dummyFunction = function () {}
      const observer = new Observer(dummyFunction)
      assert.strictEqual(observer.execute, dummyFunction)
    })
  })

  describe('exposes the last return value throught the value property', () => {
    it('exposes the last derived value for primitive values', () => {
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

    it('exposes the last derived value for object values', () => {
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
