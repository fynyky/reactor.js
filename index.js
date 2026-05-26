import { WeakRefSet } from 'weak-ref-collections'

// Global stack to automatically track dependencies
// - When an observer is updated, it first puts itself on the dependency stack
// - When a signal is read, it checks the top of the stack to see who is reading
// - The reader gets added as a dependent of the readee
// - The readee gets added as a dependency of the reader
// - When the signal evaluation is done, the observer pops itself off the stack
// The stack is used to track the latest signal caller automaticaly
// Using a stack allows nested signals to function correctly
const dependencyStack = []

// Allows "protected" variables by letting Signals/Reactors/Observers unwrap
// each others interfaces to access internal state
// In the constructor of each of them, they will map their external interfaces
// to their internal instances
const signalCoreExtractor = new WeakMap()
const reactorCoreExtractor = new WeakMap()
const observerCoreExtractor = new WeakMap()

// A batcher is used to postpone observer triggers and batch them together
// When "batch" is called it adds sets a batcher to this global variable
// When a Signal is updated it checks if a batcher is set
// If it is, it adds that observer to this set instead of triggering it
// At the end of the execution, the batch call then calls all the observers
// Then clears the batcher again
let batcher = null

// Set of reactor instances whose ownKeys need checking before observers fire.
// Owned by the apply trap: each method call (sort, push, …) initialises a
// fresh Set, trigger() adds to it, and the apply trap flushes it once in a
// try/finally — all inside batch's execute, before the observer loop runs.
// null means no apply trap is currently active; trigger() falls back to an
// immediate synchronous check in that case.
let pendingOwnKeyChecks = null

// Cache of objects to their reactor proxies
// The same object should always get turned into the same Reactor
// This allows for consistent dependency tracking
// across multiple reads of the same object
const reactorCache = new WeakMap()

// Helper function for checking if something is an object
function isObject (x) {
  // functions are objects also but typeof to function
  // nulls are not objects but typeof to objects
  // the last bit is to check for nulls
  const type = typeof (x)
  return ((type === 'function' || type === 'object') && !!x)
}

// Check whether the key set of a reactor has changed and, if so, update its
// selfSignal so that any ownKeys-watching observers are notified.
// Shared by the apply trap (called once per method via pendingOwnKeyChecks)
// and by trigger() when no apply trap is active (direct property writes).
function checkReactorOwnKeys (reactor) {
  const selfSignal = signalCoreExtractor.get(reactor.selfSignal)
  if (selfSignal.dependents.size === 0) return
  const currentOwnKeysValue = Reflect.ownKeys(reactor.source)
  const oldOwnKeysValue = selfSignal.value
  const currentSet = new Set(currentOwnKeysValue)
  const oldSet = new Set(oldOwnKeysValue)
  let changed = currentSet.size !== oldSet.size
  if (!changed) {
    for (const key of currentSet) {
      if (!oldSet.has(key)) { changed = true; break }
    }
  }
  if (changed) reactor.selfSignal(currentOwnKeysValue)
}

// Signals are observable functions representing values
// - Read a signal by calling it with no arguments
// - Write to a signal by calling it with the desired value as an argument
// When a Signal is read by an Observer it saves that Observer as a dependent
// When a Signal is written to it automatically triggers dependents
// When a Signal returns an object it is automatically wrapped in a Reactor
// -----------------------------------------------------------------------------
// Examples
// let a = new Signal(1)          Initializes it with value 1
// a()                            Returns 1
// a(2)                           Sets the value to 2
const Signals = new WeakSet()
class Signal extends Function {
  // Signal state — accessed directly by Reactor internals via signalCoreExtractor
  dependents = new Set()
  removeSelf = () => {}
  value = undefined

  constructor (initialValue) {
    // Early rejection for multiple arguments
    if (arguments.length > 1) {
      throw new Error('Signal constructor takes at most one argument')
    }

    super()

    // The interface function returned to the user. Arrow functions capture
    // `this` (the Signal instance) so all method calls use the right receiver.
    const proxy = new Proxy(this, {
      apply: (target, thisArg, args) => {
        // Early rejection for multiple arguments
        if (args.length > 1) {
          throw new Error('Signal objects take at most one argument for writes and zero arguments for reads')
        }
        // An empty call is treated as a read
        if (args.length === 0) return this.read()
        // A non-empty call is treated as a write
        return this.write(args[0])
      }
    })

    // Register the Signal for debugging/typechecking purposes
    signalCoreExtractor.set(proxy, this)
    Signals.add(proxy)

    // Initialize with the provided value before returning
    this.write(initialValue)
    return proxy
  }

  // Life of a read
  // - check to see who is asking
  // - register them as a dependent and register self as their dependency
  // - return the appropriate value
  // - wrap the result in a Reactor if its an object
  read () {
    // Check the global stack for the most recent observer being updated
    // Assume this is the caller and set it as a dependent
    // Symmetrically register dependent/dependency relationship
    const dependent = dependencyStack[dependencyStack.length - 1]
    if (dependent) {
      this.dependents.add(dependent)
      dependent.addDependency(this)
    }
    const output = this.value

    // If it's not an object then just return it right away
    if (isObject(output)) return new Reactor(output)
    else return output
  }

  // Life of a write
  // - Store the provided value
  // - Trigger any dependent Observers while collecting errors thrown
  // - Throw a CompoundError if necessary
  write (newValue) {
    // Design decision to wrap even individual signal writes in a batch
    // This allows for consistency with all dependent triggering
    // since Reactor writes are also batched
    return batch(() => {
      // Avoid triggering observers if same value is written
      if (this.value === newValue) return (this.value = newValue)
      // Save the new value
      const output = (this.value = newValue)

      // Build dependency queue
      // Do not trigger dependents directly and leave it to be handled by the batcher
      // Iterate the Set directly — we only modify batcher (not this.dependents)
      // so for...of is safe without snapshotting into a temporary Array
      for (const dependent of this.dependents) {
        // Do this so that the dependent is added to the end of the batcher queue
        // Needed to ensure downstream observers are triggered again when necessary
        // as we iterate through the batched dependents
        batcher.delete(dependent)
        batcher.add(dependent)
      }
      // If it's not an object then just return it right away
      if (isObject(output)) return new Reactor(output)
      else return output
    })
  }

  // Used by observers to remove themselves from this as dependents
  // Also removes self from any owners if there are no more dependents
  removeDependent (dependent) {
    this.dependents.delete(dependent)
    // TODO should we be doing this? clean self up if no dependents
    // What if you want it to stick around for future reads
    if (this.dependents.size === 0) this.removeSelf()
  }
}

// WeakSet of all Reactors to check if something is a Reactor
// Need to implement it this way because you can't check instanceof Proxies
const Reactors = new WeakSet()
// Reactors are observable object proxies
// - They mostly function transparently passing calls to the internal object
// - The main difference is that they track and notify Observers automatically
// - Any object returned from reading a property is itself wrapped in a Reactor
// When a Reactor property is read by an Observer it saves it as a dependent
// When a Reactor property is updated it automatically notifies dependents
// -----------------------------------------------------------------------------
// Examples
// const a = new Reactor()          Initializes a new empty Reactor object
// a.foo = 2
// a.foo                          Returns 2 as expected
// const b = new Reactor({          Wraps an existing object into a Reactor
//   quu: "mux"
//   moo: {
//     cheese: "banana"
//   }
// })
class Reactor {
  // Accessed by checkReactorOwnKeys and proxy trap closures
  source
  selfSignal
  // Null-prototype objects avoid prototype-chain collisions on keys like
  // "constructor" and remove the need for hasOwnProperty.call checks
  getSignals
  hasSignals

  constructor (initializedSource) {
    // If the source is already a reactor then do nothing and return it
    // No double wrapping of reactors allowed
    if (Reactors.has(initializedSource)) return initializedSource

    // Check to see if we've wrapped this object before
    // This allows consistency of dependencies with repeated read calls
    const existingReactor = reactorCache.get(initializedSource)
    if (existingReactor) return existingReactor

    if (arguments.length > 1) {
      throw new Error('Reactor constructor takes at most one argument')
    }

    // The source is the internal proxied object.
    // If no source is provided, use an object inheriting from Reactor.prototype
    // so that `instanceof Reactor` continues to work and error messages retain
    // the `#<Reactor>` tag. A plain `{}` would break both of those.
    if (arguments.length === 0) initializedSource = Object.create(Reactor.prototype)

    // Early rejection for non-objects
    if (!isObject(initializedSource)) {
      throw new TypeError('Reactor source must be an Object')
    }

    this.source = initializedSource
    this.selfSignal = new Signal(null)
    this.getSignals = Object.create(null)
    this.hasSignals = Object.create(null)

    // The interface proxy returned to the user. Arrow functions capture
    // `this` (the Reactor instance) so all private method calls bind correctly.
    const proxy = new Proxy(this.source, {
      apply: (target, thisArg, argumentsList) => this.#apply(thisArg, argumentsList),
      get: (target, property, receiver) => this.#get(property, receiver),
      defineProperty: (target, property, descriptor) => this.#defineProperty(property, descriptor),
      deleteProperty: (target, property) => this.#deleteProperty(property),
      has: (target, property) => this.#has(property),
      ownKeys: (target) => this.#ownKeys()
    })

    // Register the reactor for debugging/typechecking purposes
    Reactors.add(proxy)
    reactorCoreExtractor.set(proxy, this)
    reactorCache.set(initializedSource, proxy)
    return proxy
  }

  #apply (thisArg, argumentsList) {
    // Function calls on reactor properties are automatically batched
    // This allows compound function calls like "Array.push"
    // to only trigger one round of observer updates
    return batch(() => {
      // Own the pendingOwnKeyChecks lifecycle for this method call.
      // Save any outer set (handles nested apply traps), install a fresh
      // one so trigger() defers into it, then flush exactly once in the
      // finally — still inside batch's execute, so before observers fire.
      const savedPendingOwnKeyChecks = pendingOwnKeyChecks
      pendingOwnKeyChecks = new Set()
      try {
        const result = Reflect.apply(this.source, thisArg, argumentsList)
        // flat() reads elements through the proxy to build dependencies correctly,
        // but sub-arrays at the un-flattened cut-off depth end up reactor-wrapped
        // in the result because they were read from inner reactor proxies.
        // Instead we call on the proxy and then unwrap any reactor-wrapped arrays
        // left in the result.
        if (this.source === Array.prototype.flat && Array.isArray(result)) {
          const unwrapReactorArrays = (el) => {
            if (!Reactors.has(el)) return el
            const source = reactorCoreExtractor.get(el).source
            if (!Array.isArray(source)) return el
            return source.map(unwrapReactorArrays)
          }
          return result.map(unwrapReactorArrays)
        }
        return result
      } catch (error) {
        // For native object methods which can't use a Proxy as `this`
        // try again with the underlying object
        if (error.name === 'TypeError' && error.message.includes('called on incompatible receiver #')) {
          const core = reactorCoreExtractor.get(thisArg)
          if (typeof core !== 'undefined') {
            // Note that this.source and core.source are different:
            // core.source is the underlying object
            // this.source is the function being called with the object as `this`
            return Reflect.apply(this.source, core.source, argumentsList)
          }
        }
        throw error
      } finally {
        for (const reactor of pendingOwnKeyChecks) checkReactorOwnKeys(reactor)
        pendingOwnKeyChecks = savedPendingOwnKeyChecks
      }
    })
  }

  // Instead of reading a property directly
  // Reactor properties are read through a trivial Signal
  // This handles dependency tracking and sub-object Reactor wrapping
  // Accessor Signals need to be stored to allow persistent dependencies
  #get (property, receiver) {
    // Disable unnecessary wrapping for unmodifiable properties
    // Needed because Array prototype checking fails if wrapped
    // Specifically [].map()
    const descriptor = Object.getOwnPropertyDescriptor(this.source, property)
    if (descriptor && !descriptor.writable && !descriptor.configurable) {
      return Reflect.get(this.source, property, receiver)
    }
    // Resolve the raw value first — needed for both paths below
    const currentValue = (() => {
      // Handle getters which require hidden/native properties
      // If putting the proxy as `this` fails then reveal the underlying object
      try {
        return Reflect.get(this.source, property, receiver)
      } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('incompatible receiver')) return Reflect.get(this.source, property, this.source)
        throw error
      }
    })()
    // Fast path: nothing on the dependency stack means no observer is
    // tracking reads right now, so signal machinery is unnecessary.
    if (dependencyStack.length === 0) {
      if (isObject(currentValue)) return new Reactor(currentValue)
      return currentValue
    }
    // Lazily instantiate accessor signals
    if (!this.getSignals[property]) this.getSignals[property] = new Signal()
    // Use accessor signals to give the actual output
    // This enables automatic dependency tracking
    const signal = signalCoreExtractor.get(this.getSignals[property])
    signal.removeSelf = () => delete this.getSignals[property]
    signal.value = currentValue
    return signal.read()
  }

  // Notifies dependents of the defined property
  // We trap defineProperty instead of set because it avoids the ambiguity
  // of access through the prototype chain
  #defineProperty (property, descriptor) {
    const didSucceed = Reflect.defineProperty(this.source, property, descriptor)
    this.#trigger(property)
    return didSucceed
  }

  // Transparently delete the property but also trigger dependents
  #deleteProperty (property) {
    const didSucceed = Reflect.deleteProperty(this.source, property)
    this.#trigger(property)
    return didSucceed
  }

  // Have a map of dummy Signals to keep track of dependents on has
  // We don't reuse the get Signals to avoid triggering getters
  #has (property) {
    if (dependencyStack.length === 0) return Reflect.has(this.source, property)
    // Lazily instantiate has signals
    if (!this.hasSignals[property]) this.hasSignals[property] = new Signal(null)
    // Use accessor signals to give the actual output
    const signal = signalCoreExtractor.get(this.hasSignals[property])
    signal.removeSelf = () => delete this.hasSignals[property]
    const currentValue = Reflect.has(this.source, property)
    signal.value = currentValue
    return signal.read()
  }

  // Subscribe to the overall reactor by reading the selfSignal
  #ownKeys () {
    if (dependencyStack.length === 0) return Reflect.ownKeys(this.source)
    const currentKeys = Reflect.ownKeys(this.source)
    const signal = signalCoreExtractor.get(this.selfSignal)
    signal.value = currentKeys
    return signal.read()
  }

  // Force dependencies to trigger
  // Hack to do this by trivially "redefining" the signal
  #trigger (property) {
    // Batch together to avoid redundant triggering for shared observers
    batch(() => {
      // Reflect.get/has are computed lazily — only when a signal for that
      // property actually exists — so trigger() is cheap for unobserved
      // properties (e.g. every element write during sort when nobody watches)
      if (this.getSignals[property]) this.getSignals[property](Reflect.get(this.source, property))
      if (this.hasSignals[property]) this.hasSignals[property](Reflect.has(this.source, property))
      // If an apply trap is active it owns pendingOwnKeyChecks and will
      // flush once after the whole method finishes (O(1) per write).
      // Otherwise (direct property write, user-level batch()) check now.
      if (pendingOwnKeyChecks !== null) pendingOwnKeyChecks.add(this)
      else checkReactorOwnKeys(this)
    })
  }
}

// Observers are functions which automatically track their dependencies
// Once triggered they automatically retrigger whenever a dependency is updated
// A dependency is any read of Signal or property of a Reactor
// Triggering an observer with parameters saves them for future auto triggers
// Observers can be stopped and restarted
// Starting after stopping causes the Observer to execute again
// Starting does nothing if an Observer is already awake
// -----------------------------------------------------------------------------
// Examples
// let a = new Signal(1)
// let b = new Reactor()
// b.foo = "bar"
// let observer = new Observer(() => {        This will trigger whenever
//   console.log("a is now " + a())          a or b.foo are updated
//   console.log("b.foo is now " + b.foo)
// })
// observer()
// a(2)                                      This will trigger an update
//
// observer.stop()                           This will block triggers
// b.foo = "cheese"                           No trigger since we stopped it
//
// observer.start()                          Will rerun the function
//                                            and allow updates again
//
// observer.start()                          Does nothing since already started
const Observers = new WeakSet()
class Observer extends Function {
  // Core function the observer is wrapping — public so shuck() can retrieve it
  execute

  #awake = false
  // The Signals the execution block reads from
  // Cleared and rebuilt at every trigger
  // Store dependencies weakly to avoid memory loops
  #dependencies = new WeakRefSet()
  // Stored return value of the last successful execute as an observable Signal
  #valueSignal = new Signal()
  #thisContext
  #argsContext

  constructor (execute) {
    if (arguments.length !== 1) {
      throw new Error('Observer constructor requires exactly one argument')
    }

    // Parameter validation
    if (typeof execute !== 'function') {
      throw new TypeError('Cannot create observer with a non-function')
    }

    super()
    this.execute = execute

    // Public interface to hide the ugliness of how observers work
    // An empty call force triggers the block and turns it on
    // A call with arguments gets those arguments passed as a context
    // for that and future retriggers
    const proxy = new Proxy(this, {
      apply: (target, thisArg, args) => {
        this.#thisContext = thisArg
        this.#argsContext = args
        this.#awake = true
        this.trigger()
        return this.#valueSignal()
      },
      construct: (target, args) => {
        return Reflect.construct(this.execute, args, proxy)
      }
    })

    // Bind prototype methods before any own-property assignment.
    // `() => this.start()` would recurse: setting `proxy.start` creates an own
    // property on `this`, so `this.start` inside the arrow would find that own
    // property and call itself forever. Binding the prototype method avoids this.
    proxy.start = this.start.bind(this)
    proxy.stop = this.stop.bind(this)
    // Note that setting a new context does not cause the observer to trigger
    // The observer will need to be started and triggered
    proxy.setThisContext = (that) => { this.#thisContext = that }
    proxy.setArgsContext = (...args) => { this.#argsContext = args }
    // Allow reads of the last return value of execute
    // As a Signal this itself is observable and
    // builds dependencies if done within another observer
    Object.defineProperty(proxy, 'value', {
      get: () => this.#valueSignal()
    })

    // Register the observer for debugging/typechecking purposes
    observerCoreExtractor.set(proxy, this)
    Observers.add(proxy)

    // Does not trigger on initialization until () or .start() are called
    return proxy
  }

  // Symmetrically removes dependencies
  clearDependencies () {
    // Go upstream to break the connection
    this.#dependencies.forEach(dependency => {
      dependency.removeDependent(this)
    })
    // Drop own references
    this.#dependencies = new WeakRefSet()
  }

  // External call to add a dependency from a Signal being read
  addDependency (dependency) {
    this.#dependencies.add(dependency)
  }

  // Trigger the execute block and build dependencies
  // Does nothing if observer is asleep
  // If it was awake return true
  // If it was asleep return false
  trigger () {
    if (this.#awake) {
      this.clearDependencies()
      // Put self on the dependency stack
      // So any signals read by execute know who is calling
      dependencyStack.push(this)
      let result
      // Wrap execute in a try block so that
      // dependency stack is popped even if an error occurs
      try {
        result = this.execute.apply(this.#thisContext, this.#argsContext)
      } finally {
        dependencyStack.pop()
      }
      // Store the result as a subscribable signal
      // This will trigger any downstream observers
      // which depend on this observer's value
      this.#valueSignal(result)
      return true
    }
    return false
  }

  // Pause the observer preventing further triggers
  // Returns false if it was already asleep
  // Returns true if it was awake
  stop () {
    if (!this.#awake) return false
    this.#awake = false
    this.clearDependencies()
    return true
  }

  // Restart the observer if it is not already awake
  // Returns false if already awake
  // Returns true if it was woken up
  start () {
    if (this.#awake) return false
    this.#awake = true
    this.trigger()
    return true
  }
}

// Unobserve is syntactic sugar to create a dummy observer to block the triggers
// While also returning the contents of the block
const hide = function (execute) {
  if (arguments.length !== 1 || typeof execute !== 'function') {
    throw new Error('hide requires exactly one function argument')
  }
  let result
  dependencyStack.push(null)
  try {
    result = execute()
  } finally {
    dependencyStack.pop()
  }
  return result
}

// Method for allowing users to batch multiple observer updates together
const batch = function (execute) {
  if (arguments.length !== 1 || typeof execute !== 'function') {
    throw new Error('batch requires exactly one function argument')
  }

  if (batcher === null) {
    // If a batcher is set then signals will not trigger observers immediately
    // Instead they will be saved into the batcher to trigger after
    // Using a Set allows the removal of redundant triggering in observers
    batcher = new Set()
    const errorList = []

    // Execute the given block and collect the triggered observers
    let result
    try { result = execute() } catch (error) {
      // If I want to fail forward store the error
      // and try to trigger the relevant observers so far
      errorList.push(error)
      // If I want to fail fast instead
      // batcher = null
      // throw error
    }

    // Trigger the collected observers
    // If an error occurs, collect it and keep going
    // A consolidated error will be thrown at the end of propagation
    for (const observer of batcher) {
      try { observer.trigger() } catch (error) { errorList.push(error) }
    }

    // If any errors occurred during propagation
    // consolidate and throw them
    batcher = null
    if (errorList.length === 1) {
      throw errorList[0]
    } else if (errorList.length > 1) {
      const errorMessage = 'Multiple errors from batched reactor observers'
      throw new CompoundError(errorMessage, errorList)
    }

    return result
  // No need to do anything if batching is already taking place
  } else {
    return execute()
  }
}

// Method for extracting the internal object from a Reactor
// or extracting the internal function from an Observer
const shuck = (shuckee) => {
  let output = shuckee
  if (Reactors.has(output)) output = reactorCoreExtractor.get(output).source
  if (Observers.has(output)) output = observerCoreExtractor.get(output).execute
  return output
}

// Custom Error to consolidate multiple errors together
class CompoundError extends Error {
  constructor (message, errorList) {
    // Flatten any compound errors in the error list
    errorList = errorList.flatMap(error => {
      if (error instanceof CompoundError) return error.cause
      return error
    })
    // Build the message to display all the component errors
    message = message + '\n' + errorList.length + ' errors in total'
    for (const error of errorList) {
      const errorDescription =
        error.stack != null ? error.stack : error.toString()
      message = message + '\n' + errorDescription
    }
    super(message, { cause: errorList })
    this.name = this.constructor.name
    return this
  }
}

export {
  Signal,
  Reactor,
  Observer,
  Signals,
  Reactors,
  Observers,
  signalCoreExtractor,
  reactorCoreExtractor,
  observerCoreExtractor,
  hide,
  batch,
  shuck
}
