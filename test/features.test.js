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
} from '../index.js'

describe('Minor Features', () => {
  describe('Starting and stopping observers', () => {
    it('activates observers with start', () => {
      let counter = 0
      let tracker
      const reactor = new Reactor({ value: 'foo' })
      const observer = new Observer(() => {
        counter += 1
        tracker = reactor.value
      })
      assert.equal(counter, 0)
      assert.equal(tracker, undefined)
      observer.start()
      assert.equal(counter, 1)
      assert.equal(tracker, 'foo')
      reactor.value = 'bar'
      assert.equal(counter, 2)
      assert.equal(tracker, 'bar')
    })

    it('deactivates observers with stop', () => {
      let counter = 0
      let tracker
      const reactor = new Reactor({ value: 'foo' })
      const observer = new Observer(() => {
        counter += 1
        tracker = reactor.value
      })
      observer.start()
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
      observer.start()
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

    it('does nothing calling start on an active observer', () => {
      let counter = 0
      let tracker = null
      const reactor = new Reactor({ value: 'foo' })
      const observer = new Observer(() => {
        counter += 1
        tracker = reactor.value
      })
      observer.start()
      assert.equal(counter, 1)
      assert.equal(tracker, 'foo')
      observer.start()
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

  describe('Observer context setting', () => {
    it('defaults single argument context to undefined', () => {
      let contextChecker = 'foo'
      new Observer((parameter) => {
        contextChecker = parameter
      })()
      assert(typeof contextChecker === 'undefined')
    })

    it('defaults arguments context to an empty array', () => {
      let contextChecker = 'foo'
      new Observer(function () {
        contextChecker = Array.from(arguments)
      })()
      assert.deepEqual(contextChecker, [])
    })

    it('defaults this context to undefined', () => {
      let contextChecker = 'foo'
      new Observer(() => {
        contextChecker = this
      })()
      assert(typeof contextChecker === 'undefined')
    })

    it('sets single argument context by calling the observer with an argument', () => {
      let contextChecker
      const reactor = new Reactor({ foo: 'bar' })
      const observer = new Observer((context) => {
        contextChecker = reactor.foo + context
      })
      observer('baz')
      assert.equal(contextChecker, 'barbaz')
      reactor.foo = 'qux'
      assert.equal(contextChecker, 'quxbaz')
      observer()
      assert.equal(contextChecker, 'quxundefined')
    })

    it('sets multiple arguments context by calling the observer with multiple arguments', () => {
      let contextChecker
      const reactor = new Reactor({ foo: 'bar' })
      const observer = new Observer((a, b, c) => {
        contextChecker = reactor.foo + a + b + c
      })
      observer('apple', 'banana', 'cherry')
      assert.equal(contextChecker, 'barapplebananacherry')
      reactor.foo = 'baz'
      assert.equal(contextChecker, 'bazapplebananacherry')
      observer()
      assert.equal(contextChecker, 'bazundefinedundefinedundefined')
    })

    it('sets arguments context by calling the observer with arguments', () => {
      let contextChecker
      const reactor = new Reactor({ foo: 'bar' })
      const observer = new Observer(function (a, b, c) {
        contextChecker = Array.from(arguments).join(reactor.foo)
      })
      observer('apple', 'banana', 'cherry')
      assert.equal(contextChecker, 'applebarbananabarcherry')
      reactor.foo = 'baz'
      assert.equal(contextChecker, 'applebazbananabazcherry')
      observer()
      assert.equal(contextChecker, '')
    })
  })
})
