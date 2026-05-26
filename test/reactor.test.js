import { describe, it } from 'node:test'
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
} from '../index.js'

describe('Reactor', () => {
  describe('initializes with an object and returns it wrapped in a reactor', () => {
    it('initializes with an object returning it wrapped in a reactor', () => {
      const object = {}
      const reactor = new Reactor(object)
      assert(Reactors.has(reactor))
      assert.strictEqual(shuck(reactor), object)
    })

    it('initializes with a function returning it wrapped in a reactor', () => {
      const func = () => {}
      const reactor = new Reactor(func)
      assert(Reactors.has(reactor))
      assert.strictEqual(shuck(reactor), func)
    })

    it('initializes with no arguments automatically making an object and returning it wrapped in a reactor', () => {
      const reactor = new Reactor()
      assert(Reactors.has(reactor))
      assert.deepEqual(shuck(reactor), {})
    })

    it('returns the same reactor when initialized with an existing reactor', () => {
      const object = {}
      const reactor1 = new Reactor(object)
      const reactor2 = new Reactor(reactor1)
      assert(Reactors.has(reactor1))
      assert(Reactors.has(reactor2))
      assert.strictEqual(reactor1, reactor2)
      assert.strictEqual(shuck(reactor1), shuck(reactor2))
      assert.strictEqual(shuck(reactor1), object)
      assert.strictEqual(shuck(reactor2), object)
    })

    it('returns the same reactor when initialized with the same object', () => {
      const object = {}
      const reactor1 = new Reactor(object)
      const reactor2 = new Reactor(object)
      assert(!Reactors.has(object))
      assert(Reactors.has(reactor1))
      assert(Reactors.has(reactor2))
      assert.strictEqual(reactor1, reactor2)
      assert.strictEqual(shuck(reactor1), shuck(reactor2))
      assert.strictEqual(shuck(reactor1), object)
      assert.strictEqual(shuck(reactor2), object)
    })

    describe('throws an error when initialized with invalid parameters', () => {
      it('throws an error when initialized with a string', () => {
        assert.throws(() => new Reactor('foo'), {
          name: 'TypeError',
          message: 'Reactor source must be an Object'
        })
      })
      it('throws an error when initialized with a number', () => {
        assert.throws(() => new Reactor(123), {
          name: 'TypeError',
          message: 'Reactor source must be an Object'
        })
      })
      it('throws an error when initialized with a bigint', () => {
        assert.throws(() => new Reactor(123456789123456789n), {
          name: 'TypeError',
          message: 'Reactor source must be an Object'
        })
      })
      it('throws an error when initialized with a symbol', () => {
        assert.throws(() => new Reactor(Symbol('foo')), {
          name: 'TypeError',
          message: 'Reactor source must be an Object'
        })
      })
      it('throws an error when initialized with a boolean true value', () => {
        assert.throws(() => new Reactor(true), {
          name: 'TypeError',
          message: 'Reactor source must be an Object'
        })
      })
      it('throws an error when initialized with a boolean false value', () => {
        assert.throws(() => new Reactor(false), {
          name: 'TypeError',
          message: 'Reactor source must be an Object'
        })
      })
      it('throws an error when initialized with a zero value', () => {
        assert.throws(() => new Reactor(0), {
          name: 'TypeError',
          message: 'Reactor source must be an Object'
        })
      })
      it('throws an error when initialized with an empty string', () => {
        assert.throws(() => new Reactor(''), {
          name: 'TypeError',
          message: 'Reactor source must be an Object'
        })
      })
      it('throws an error when initialized with a null value', () => {
        assert.throws(() => new Reactor(null), {
          name: 'TypeError',
          message: 'Reactor source must be an Object'
        })
      })
      it('throws an error when initialized with an undefined value', () => {
        assert.throws(() => new Reactor(undefined), {
          name: 'TypeError',
          message: 'Reactor source must be an Object'
        })
      })
      it('throws an error when initialized with multiple arguments', () => {
        assert.throws(() => new Reactor({}, {}), {
          name: 'Error',
          message: 'Reactor constructor takes at most one argument'
        })
      })
    })
  })

  describe('exposes the same properties and returns values from the wrapped object', () => {
    it('reads the same primitive values as the wrapped object when initialized', () => {
      const reactor = new Reactor({ foo: 'bar' })
      assert.strictEqual(reactor.foo, 'bar')
    })
    it('reads the same primitive values from the wrapped object when it is modified', () => {
      const object = { foo: 'bar' }
      const reactor = new Reactor(object)
      object.foo = 'baz'
      assert.strictEqual(reactor.foo, 'baz')
    })
  })

  describe('returns object values recursively wrapped in reactors', () => {
    it('returns an object value as a reactor', () => {
      const object = {}
      const reactor = new Reactor({
        foo: object
      })
      const readResult = reactor.foo
      assert.notStrictEqual(object, readResult)
      assert(Reactors.has(readResult))
      assert.strictEqual(object, shuck(readResult))
    })
    it('returns a nested object value as a reactor', () => {
      const object = {}
      const reactor = new Reactor({
        foo: {
          bar: object
        }
      })
      const readResult = reactor.foo.bar
      assert.notStrictEqual(object, readResult)
      assert(Reactors.has(readResult))
      assert.strictEqual(object, shuck(readResult))
    })
  })

  describe('can set properties and get what was set', () => {
    it('sets values through to the wrapped object', () => {
      const object = {}
      const reactor = new Reactor(object)
      reactor.foo = 'bar'
      assert.strictEqual(object.foo, 'bar')
    })

    it('returns the set values', () => {
      const object = {}
      const reactor = new Reactor(object)
      const writeReturn = (reactor.foo = 'bar')
      assert.strictEqual(writeReturn, 'bar')
    })

    it('gets the value that was set', () => {
      const object = {}
      const reactor = new Reactor(object)
      reactor.foo = 'bar'
      assert.strictEqual(reactor.foo, 'bar')
    })

    it('deletes properties from the wrapped object', () => {
      const object = { foo: 'bar' }
      const reactor = new Reactor(object)
      delete reactor.foo
      assert.strictEqual(object.foo, undefined)
    })

    it('deletes properties from itself', () => {
      const object = { foo: 'bar' }
      const reactor = new Reactor(object)
      delete reactor.foo
      assert.strictEqual(reactor.foo, undefined)
    })

    it('works with Object.defineProperty', () => {
      const proxiedObject = {}
      const reactor = new Reactor(proxiedObject)
      const result = Object.defineProperty(reactor, 'foo', {
        get () { return 'bar' }
      })
      assert.strictEqual(proxiedObject.foo, 'bar')
      assert.strictEqual(reactor.foo, 'bar')
      assert.strictEqual(result, reactor)
    })

    it('respects the writable property descriptor', () => {
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
  })

  describe('maintains compatibility with native object behavior', () => {
    it('works with Array.prototype.map()', () => {
      const reactor = new Reactor(['0', '1', '2'])
      const result = reactor.map(x => 'this is ' + x)
      assert.deepStrictEqual(result, ['this is 0', 'this is 1', 'this is 2'])
    })

    it('works with Array.prototype.filter()', () => {
      const reactor = new Reactor([1, 2, 3, 4, 5, 6])
      const result = reactor.filter(x => x % 2 === 0)
      assert.deepStrictEqual(result, [2, 4, 6])
    })

    it('works with Array.prototype.reduce()', () => {
      const reactor = new Reactor([1, 2, 3, 4, 5])
      const result = reactor.reduce((sum, x) => sum + x, 0)
      assert.strictEqual(result, 15)
    })

    it('works with Array.prototype.reduceRight()', () => {
      const reactor = new Reactor([1, 2, 3, 4, 5])
      const result = reactor.reduceRight((sum, x) => sum + x, 0)
      assert.strictEqual(result, 15)
    })

    it('works with Array.prototype.find()', () => {
      const reactor = new Reactor([1, 2, 3, 4, 5])
      const result = reactor.find(x => x > 3)
      assert.strictEqual(result, 4)
    })

    it('works with Array.prototype.findIndex()', () => {
      const reactor = new Reactor([1, 2, 3, 4, 5])
      const result = reactor.findIndex(x => x > 3)
      assert.strictEqual(result, 3)
    })

    it('works with Array.prototype.some()', () => {
      const reactor = new Reactor([1, 2, 3, 4, 5])
      const result = reactor.some(x => x > 3)
      assert.strictEqual(result, true)
    })

    it('works with Array.prototype.every()', () => {
      const reactor = new Reactor([1, 2, 3, 4, 5])
      const result = reactor.every(x => x > 0)
      assert.strictEqual(result, true)
    })

    it('works with Array.prototype.forEach()', () => {
      const reactor = new Reactor([1, 2, 3])
      const results = []
      reactor.forEach(x => results.push(x * 2))
      assert.deepStrictEqual(results, [2, 4, 6])
    })

    it('works with Array.prototype.slice()', () => {
      const reactor = new Reactor([1, 2, 3, 4, 5])
      const result = reactor.slice(1, 4)
      assert.deepStrictEqual(result, [2, 3, 4])
    })

    it('works with Array.prototype.splice()', () => {
      const reactor = new Reactor([1, 2, 3, 4, 5])
      const removed = reactor.splice(1, 2, 'a', 'b')
      assert.deepStrictEqual(removed, [2, 3])
      assert.deepStrictEqual(shuck(reactor), [1, 'a', 'b', 4, 5])
    })

    it('works with Array.prototype.concat()', () => {
      const reactor = new Reactor([1, 2, 3])
      const result = reactor.concat([4, 5], [6])
      assert.deepStrictEqual(result, [1, 2, 3, 4, 5, 6])
    })

    it('works with Array.prototype.join()', () => {
      const reactor = new Reactor(['a', 'b', 'c'])
      const result = reactor.join('-')
      assert.strictEqual(result, 'a-b-c')
    })

    it('works with Array.prototype.reverse()', () => {
      const reactor = new Reactor([1, 2, 3, 4])
      const result = reactor.reverse()
      assert.deepStrictEqual(shuck(result), [4, 3, 2, 1])
      assert.deepStrictEqual(shuck(reactor), [4, 3, 2, 1]) // reverse modifies in place
    })

    it('works with Array.prototype.sort()', () => {
      const reactor = new Reactor([3, 1, 4, 1, 5])
      const result = reactor.sort()
      assert.deepStrictEqual(shuck(result), [1, 1, 3, 4, 5])
      assert.deepStrictEqual(shuck(reactor), [1, 1, 3, 4, 5]) // sort modifies in place
    })

    it('works with Array.prototype.sort() with comparator', () => {
      const reactor = new Reactor([3, 1, 4, 1, 5])
      const result = reactor.sort((a, b) => b - a)
      assert.deepStrictEqual(shuck(result), [5, 4, 3, 1, 1])
    })

    it('works with Array.prototype.flat()', () => {
      const reactor = new Reactor([1, [2, 3], [4, [5, 6]]])
      assert.deepStrictEqual(reactor.flat(), [1, 2, 3, 4, [5, 6]])
    })

    it('works with Array.prototype.flatMap()', () => {
      const reactor = new Reactor([1, 2, 3])
      const result = reactor.flatMap(x => [x, x * 2])
      assert.deepStrictEqual(result, [1, 2, 2, 4, 3, 6])
    })

    it('works with Array.prototype.includes()', () => {
      const reactor = new Reactor([1, 2, 3, 4, 5])
      assert.strictEqual(reactor.includes(3), true)
      assert.strictEqual(reactor.includes(6), false)
    })

    it('works with Array.prototype.indexOf()', () => {
      const reactor = new Reactor([1, 2, 3, 2, 5])
      assert.strictEqual(reactor.indexOf(2), 1)
      assert.strictEqual(reactor.indexOf(6), -1)
    })

    it('works with Array.prototype.lastIndexOf()', () => {
      const reactor = new Reactor([1, 2, 3, 2, 5])
      assert.strictEqual(reactor.lastIndexOf(2), 3)
      assert.strictEqual(reactor.lastIndexOf(6), -1)
    })

    it('works with Array.prototype.entries()', () => {
      const reactor = new Reactor(['a', 'b', 'c'])
      const result = Array.from(reactor.entries())
      assert.deepStrictEqual(result, [[0, 'a'], [1, 'b'], [2, 'c']])
    })

    it('works with Array.prototype.keys()', () => {
      const reactor = new Reactor(['a', 'b', 'c'])
      const result = Array.from(reactor.keys())
      assert.deepStrictEqual(result, [0, 1, 2])
    })

    it('works with Array.prototype.values()', () => {
      const reactor = new Reactor(['a', 'b', 'c'])
      const result = Array.from(reactor.values())
      assert.deepStrictEqual(result, ['a', 'b', 'c'])
    })

    it('works with Array.prototype.fill()', () => {
      const reactor = new Reactor([1, 2, 3, 4, 5])
      const result = reactor.fill(0, 1, 4)
      assert.deepStrictEqual(shuck(result), [1, 0, 0, 0, 5])
      assert.deepStrictEqual(shuck(reactor), [1, 0, 0, 0, 5]) // fill modifies in place
    })

    it('works with Array.prototype.copyWithin()', () => {
      const reactor = new Reactor([1, 2, 3, 4, 5])
      const result = reactor.copyWithin(0, 3, 5)
      assert.deepStrictEqual(shuck(result), [4, 5, 3, 4, 5])
      assert.deepStrictEqual(shuck(reactor), [4, 5, 3, 4, 5]) // copyWithin modifies in place
    })

    it('works with Array.prototype.push()', () => {
      const reactor = new Reactor([1, 2, 3])
      const result = reactor.push(4, 5)
      assert.strictEqual(result, 5)
      assert.deepStrictEqual(shuck(reactor), [1, 2, 3, 4, 5])
    })

    it('works with Array.prototype.pop()', () => {
      const reactor = new Reactor([1, 2, 3])
      const result = reactor.pop()
      assert.strictEqual(result, 3)
      assert.deepStrictEqual(shuck(reactor), [1, 2])
    })

    it('works with Array.prototype.shift()', () => {
      const reactor = new Reactor([1, 2, 3])
      const result = reactor.shift()
      assert.strictEqual(result, 1)
      assert.deepStrictEqual(shuck(reactor), [2, 3])
    })

    it('works with Array.prototype.unshift()', () => {
      const reactor = new Reactor([1, 2, 3])
      const result = reactor.unshift(0, -1)
      assert.strictEqual(result, 5)
      assert.deepStrictEqual(shuck(reactor), [0, -1, 1, 2, 3])
    })

    it('works with Array.prototype.length property', () => {
      const reactor = new Reactor([1, 2, 3])
      assert.strictEqual(reactor.length, 3)
      reactor.push(4)
      assert.strictEqual(reactor.length, 4)
    })

    it('works with Array.prototype.isArray()', () => {
      const reactor = new Reactor([1, 2, 3])
      assert.strictEqual(Array.isArray(reactor), true)
    })

    it('works with Array.prototype.from()', () => {
      const reactor = new Reactor([1, 2, 3])
      const result = Array.from(reactor, x => x * 2)
      assert.deepStrictEqual(result, [2, 4, 6])
    })

    it('works with Array.prototype.of()', () => {
      const reactor = new Reactor([1, 2, 3])
      const result = Array.of(...reactor, 4, 5)
      assert.deepStrictEqual(result, [1, 2, 3, 4, 5])
    })

    it('can read native properties', () => {
      const map = new Map()
      const reactor = new Reactor(map)
      // Normally proxy wrapping will fail
      // This checks to see if we redirect the call `this`
      // to the wrapped object instead of the wrapper when appropriate
      assert.strictEqual(reactor.size, 0)
      map.set('foo', 'bar')
      assert.strictEqual(reactor.size, 1)
    })

    it('can call native object methods', () => {
      const reactor = new Reactor(new Map())
      // Normally proxy wrapping will fail
      // since .keys() cannot be called on a Proxy
      const result = reactor.keys()
      assert(typeof result[Symbol.iterator] === 'function')
    })
  })

  describe('preserves object identity and inheritance behavior', () => {
    // When initialized with an existing object, it has reactor behaviours but is not a Reactor instance
    // This is because we maintain the original class inheritance chain instead
    // and javascript does not support multiple inheritance
    it('is an instance of its original class when initialized with an existing object', () => {
      const object = new Date()
      const reactor = new Reactor(object)
      const originalClass = object.constructor
      assert(reactor instanceof originalClass)
    })

    it('is an instance of Reactor when initialized with no arguments', () => {
      const reactor = new Reactor()
      assert(reactor instanceof Reactor)
    })

    it('respects receiver this context for prototype inheritors', () => {
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
