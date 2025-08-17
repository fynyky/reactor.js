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
