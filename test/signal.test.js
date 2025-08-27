/* eslint-env mocha */
import assert from 'assert'
import {
  Signal,
  // Reactor,
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
} from '../index.js'

describe('Signal', () => {
  describe('initializes with any single value', () => {
    it('initializes with a string', () => new Signal('foo'))
    it('initializes with a number', () => new Signal(123))
    it('initializes with a bigint', () => new Signal(123456789123456789n))
    it('initializes with a symbol', () => new Signal(Symbol('foo')))
    it('initializes with true', () => new Signal(true))
    it('initializes with false', () => new Signal(false))
    it('initializes with an empty string', () => new Signal(''))
    it('initializes with zero', () => new Signal(0))
    it('initializes with null', () => new Signal(null))
    it('initializes with undefined', () => new Signal(undefined))
    it('initializes with an object', () => new Signal({}))
    it('initializes with a function', () => new Signal(() => {}))
    it('initializes with no arguments', () => new Signal())
    it('throws an error when initialized with multiple arguments', () => {
      assert.throws(() => new Signal('foo', 'bar'), {
        name: 'Error',
        message: 'Signal constructor takes at most one argument'
      })
    })
  })

  describe('returns the initial value when called with no arguments', () => {
    it('returns a string', () => {
      const value = 'foo'
      const signal = new Signal(value)
      assert.strictEqual(signal(), value)
    })

    it('returns a number', () => {
      const value = 123
      const signal = new Signal(value)
      assert.strictEqual(signal(), value)
    })

    it('returns a bigint', () => {
      const value = 123456789123456789n
      const signal = new Signal(value)
      assert.strictEqual(signal(), value)
    })

    it('returns a symbol', () => {
      const value = Symbol('foo')
      const signal = new Signal(value)
      assert.strictEqual(signal(), value)
    })

    it('returns true', () => {
      const value = true
      const signal = new Signal(value)
      assert.strictEqual(signal(), value)
    })

    it('returns false', () => {
      const value = false
      const signal = new Signal(value)
      assert.strictEqual(signal(), value)
    })

    it('returns an empty string', () => {
      const value = ''
      const signal = new Signal(value)
      assert.strictEqual(signal(), value)
    })

    it('returns zero', () => {
      const value = 0
      const signal = new Signal(value)
      assert.strictEqual(signal(), value)
    })

    it('returns null', () => {
      const value = null
      const signal = new Signal(value)
      assert.strictEqual(signal(), value)
    })

    it('returns undefined', () => {
      const value = undefined
      const signal = new Signal(value)
      assert.strictEqual(signal(), value)
    })

    describe('returns objects wrapped in a reactor', () => {
      it('returns an object wrapped in a reactor', () => {
        const dummyObject = {}
        const signal = new Signal(dummyObject)
        const result = signal()
        assert(Reactors.has(result))
        assert.strictEqual(shuck(result), dummyObject)
      })

      it('returns a function wrapped in a reactor', () => {
        const dummyFunction = () => {}
        const signal = new Signal(dummyFunction)
        const result = signal()
        assert(Reactors.has(result))
        assert.strictEqual(shuck(result), dummyFunction)
      })
    })
  })

  describe('updates its stored value when called with an argument then returns the new value', () => {
    it('updates with a string', () => {
      const signal = new Signal()
      assert.strictEqual(signal(), undefined)
      const value = 'foo'
      const writeReturn = signal(value)
      assert.strictEqual(writeReturn, value)
      const readReturn = signal()
      assert.strictEqual(readReturn, value)
    })

    it('updates with a number', () => {
      const signal = new Signal()
      assert.strictEqual(signal(), undefined)
      const value = 123
      const writeReturn = signal(value)
      assert.strictEqual(writeReturn, value)
      const readReturn = signal()
      assert.strictEqual(readReturn, value)
    })

    it('updates with a bigint', () => {
      const signal = new Signal()
      assert.strictEqual(signal(), undefined)
      const value = 123456789123456789n
      const writeReturn = signal(value)
      assert.strictEqual(writeReturn, value)
      const readReturn = signal()
      assert.strictEqual(readReturn, value)
    })

    it('updates with a symbol', () => {
      const signal = new Signal()
      assert.strictEqual(signal(), undefined)
      const value = Symbol('foo')
      const writeReturn = signal(value)
      assert.strictEqual(writeReturn, value)
      const readReturn = signal()
      assert.strictEqual(readReturn, value)
    })

    it('updates with true', () => {
      const signal = new Signal()
      assert.strictEqual(signal(), undefined)
      const value = true
      const writeReturn = signal(value)
      assert.strictEqual(writeReturn, value)
      const readReturn = signal()
      assert.strictEqual(readReturn, value)
    })

    it('updates with false', () => {
      const signal = new Signal()
      assert.strictEqual(signal(), undefined)
      const value = false
      const writeReturn = signal(value)
      assert.strictEqual(writeReturn, value)
      const readReturn = signal()
      assert.strictEqual(readReturn, value)
    })

    it('updates with an empty string', () => {
      const signal = new Signal()
      assert.strictEqual(signal(), undefined)
      const value = ''
      const writeReturn = signal(value)
      assert.strictEqual(writeReturn, value)
      const readReturn = signal()
      assert.strictEqual(readReturn, value)
    })

    it('updates with zero', () => {
      const signal = new Signal()
      assert.strictEqual(signal(), undefined)
      const value = 0
      const writeReturn = signal(value)
      assert.strictEqual(writeReturn, value)
      const readReturn = signal()
      assert.strictEqual(readReturn, value)
    })

    it('updates with null', () => {
      const signal = new Signal()
      assert.strictEqual(signal(), undefined)
      const value = null
      const writeReturn = signal(value)
      assert.strictEqual(writeReturn, value)
      const readReturn = signal()
      assert.strictEqual(readReturn, value)
    })

    it('updates with undefined', () => {
      const signal = new Signal('foo')
      assert.strictEqual(signal(), 'foo')
      const value = undefined
      const writeReturn = signal(value)
      assert.strictEqual(writeReturn, value)
      const readReturn = signal()
      assert.strictEqual(readReturn, value)
    })

    it('updates with an object and returns it wrapped in a reactor', () => {
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

    it('updates with a function and returns it wrapped in a reactor', () => {
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

    it('throws an error when called with multiple arguments', () => {
      const signal = new Signal()
      assert.throws(() => signal(1, 2), {
        name: 'Error',
        message: 'Signal objects take at most one argument for writes and zero arguments for reads'
      })
    })
  })
})
