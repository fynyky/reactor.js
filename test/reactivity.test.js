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
} from '../src/index.js'

describe('Reactivity', () => {
  describe('Observers are inactive until they are run', () => {
    it('does not trigger on a signal update if it has not been run', () => {
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
    it('does not trigger on a reactor update if it has not been run', () => {
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

  describe('Observers form dependencies when run and trigger on their updates', () => {
    it('builds a dependency when reading a signal', () => {
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

    it('builds a dependency when reading a reactor', () => {
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

    it('builds a dependency when reading another observer value', () => {
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

    it('builds a dependency when calling another observer', () => {
      let runCount = 0
      let runValue
      const reactor = new Reactor({ foo: 'bar' })
      const headObserver = new Observer(() => reactor.foo)
      const tailObserver = new Observer(() => {
        runCount += 1
        runValue = headObserver()
      })
      tailObserver()
      assert.strictEqual(runCount, 1)
      assert.strictEqual(runValue, 'bar')
      reactor.foo = 'baz'
      assert.strictEqual(runCount, 2)
      assert.strictEqual(runValue, 'baz')
    })

    it('builds a dependency when using Object.keys', () => {
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

    it('builds a dependency when using the in operator', () => {
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

    it('builds a dependency when using defineProperty', () => {
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

    it('builds a dependency when using deleteProperty', () => {
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

    it('is able to be triggered repeatedly', () => {
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

    describe('Observers can form dependencies on subproperties and trigger on their updates', () => {
      it('triggers if a relevant subproperty of its dependency is updated', () => {
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

      it('does not trigger if an irrelevant subproperty of its dependency is updated', () => {
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

      it('triggers if a subproperty it depends on directly is updated', () => {
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

      it('triggers if a parent of a subproperty it depends on is updated', () => {
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

      it('does not trigger if an irrelevant sibling subproperty of its subproperty dependency is updated', () => {
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

      describe('triggers on array update methods', () => {
        it('triggers on an array index assignment', () => {
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

        it('triggers on an array push', () => {
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

        it('triggers on an array pop', () => {
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

        it('triggers on an array shift', () => {
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

        it('triggers on an array unshift', () => {
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

        it('triggers on an array splice', () => {
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

        it('triggers on an array sort', () => {
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

        it('triggers on an array reverse', () => {
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

        it('triggers on an array fill', () => {
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

        it('triggers on an array copyWithin', () => {
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

        it('triggers on an array length change', () => {
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

        it('does not trigger on an array length set to its current value', () => {
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

        it('triggers on array operations that change length', () => {
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

        it('triggers on array operations that modify existing elements', () => {
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

        it('is able to be triggered repeatedly by multiple array operations', () => {
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
  })

  describe('Observers rebuild dependencies each time they run', () => {
    it('builds new dependencies on retriggers', () => {
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
    it('breaks old dependencies when no longer needed', () => {
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

  describe('Observers trigger only once per update', () => {
    it('triggers only once despite multiple identical dependencies', () => {
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
    it('triggers only once despite multiple different dependencies', () => {
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
    it('triggers only once for native methods attached to the Reactor with multiple changes on itself', () => {
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
    it('triggers only once for custom methods attached to the Reactor with multiple changes on itself', () => {
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

  describe('Signals do not trigger observers when updated to an identical value', () => {
    it('does not redundantly trigger on setting an identical primitive value on a Signal', () => {
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
    it('does not redundantly trigger on setting an identical primitive value on a Reactor', () => {
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
    it('does not redundantly trigger on setting an identical primitive value on an Observer', () => {
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
    it('does not redundantly trigger on setting an identical object value', () => {
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
    it('triggers on setting an identical but different object', () => {
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
