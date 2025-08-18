/* eslint-env mocha */
import assert from 'assert'
import {
  // Signal,
  Reactor,
  Observer
  // Signals,
  // Reactors,
  // Observers,
  // signalCoreExtractor,
  // reactorCoreExtractor,
  // observerCoreExtractor,
  // hide,
  // batch,
  // shuck
} from '../src/reactor.js'

describe('Minor Features', () => {
  describe('Start and Stop', () => {
    it('deactivates observers with stop', () => {
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

    it('reactivates observers with start after stopping', () => {
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

    it('has no effect with repeated start calls', () => {
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
    it('defaults context to undefined', () => {
      let contextChecker = 'foo'
      new Observer((context) => {
        contextChecker = context
      })()
      assert(typeof contextChecker === 'undefined')
    })

    it('sets context by calling the observer with an argument', () => {
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

    it('sets context by calling the observer with multiple params', () => {
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

    it('retains the set context on an observer when getting triggered later', () => {
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
    it('redefines an observer by setting the execute property', () => {
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
