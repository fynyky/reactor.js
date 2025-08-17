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
  // batch,
  shuck
} from '../src/reactor.js'

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
