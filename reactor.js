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
// each others interfaces to access internal core variables
// In the constructor of each of them, they will map their external interfaces
// to their internal cores
const coreExtractor = new WeakMap()

// A batcher is used to postpone observer triggers and batch them together
// When "batch" is called it adds sets a batcher to this global variable
// When a Signal is updated it checks if a batcher is set
// If it is, it adds that observer to this set instead of triggering it
// At the end of the exeution, the batch call then calls all the observers
// Then clears the batcher again
let batcher = null

// Cache of objects to their reactor proxies
// Allows for consistent dependency tracking
// across multiple reads of the same object
const reactorCache = new WeakMap()

// Definition is a shell class to identify dynamically calculated variables
// Accessed through the "define" function
// Class itself is not meant to be instantiated directly
// It is only for internal type checking
// -----------------------------------------------------------------------------
// Examples
// let a = new Signal(define(() => Date.now()))
// let b = new Signal(1);
// b = new Signal(define(() => {
//   return "hello it is now " + a();
// }));
// let c = new Reactor();
// c.foo = define(() => "the message is " + b());
class Definition {
  constructor (definition) {
    if (typeof definition === 'function') {
      this.definition = definition
      return this
    }
    throw new TypeError('Cannot create definition with a non-function')
  }
}
// Expose a define "keyword" instead of the class itself
// This seems nicer syntactic sugar than "new Definition(...)" each time
const define = (definition) => new Definition(definition)

// Signals are observable functions representing values
// - Read a signal by calling it with no arguments
// - Write to a signal by calling it with the desired value as an argument
// - Define a "getter" signal by calling it with a definition as an argument
// When a Signal is read by an Observer it saves that Observer as a dependent
// When a Signal is written to it automatically triggers dependents
// When a Signal returns an object it is automatically wrapped in a Reactor
// -----------------------------------------------------------------------------
// Examples
// let a = new Signal(1)          Initializes it with value 1
// a()                            Returns 1
// a(2)                           Sets the value to 2
// a(define(() => Date.now()))    Sets a dynamic getter instead of static value
const Signals = new WeakSet()
class Signal {
  // Signals are made up of 2 main parts
  // - The core: The properties & methods which lets signals work
  // - The interface: The function returned to the user to use
  constructor (initialValue) {
    // The "guts" of a Signal containing properties and methods
    // All actual functionality & state should be built into the core
    // Should be completely agnostic to syntactic sugar
    const signalCore = {

      // Signal state
      // value: undefined, // The set value. Purposed undefined as undefined
      dependents: new Set(), // The Observers which rely on this Signal
      removeSelf: () => {}, // callback set by parent Reactor to allow removal
      // Used to delete Signals with no dependents
      // To reduce memory leaks

      // Life of a read
      // - check to see who is asking
      // - register them as a dependent and register self as their dependency
      // - return the appropriate static or dynamic value
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
        // Return the appropriate static or calculated value
        const output = (this.value instanceof Definition)
          ? this.value.definition()
          : this.value

        // If it's not an object then just return it right away
        // Cleaner and faster than the alternative approach of constructing a Reactor
        // and catching an error
        if (output === null) return output
        if (typeof output !== 'function' && typeof output !== 'object') return output

        // Wrap the output in a Reactor if it's an object
        // No need to wrap it if its already a Reactor
        if (Reactors.has(output)) return output
        // If not then wrap and store it for future reads
        return new Reactor(output)
      },

      // Life of a write
      // - If the new value is a Definition then save it as a getter
      // - Otherwise just store the provided value
      // - Trigger any dependent Observers while collecting errors thrown
      // - Throw a CompoundError if necessary
      write (newValue) {
        if (this.value === newValue) return (this.value = newValue)
        // Save the new value/definition
        const output = (this.value = newValue)
        // Trigger dependents
        // Need to do an array copy to avoid an infinite loop
        // Triggering a dependent will remove it from the dependent set
        // Then re-add it when it is execute
        // This will cause the iterator to trigger again
        const errorList = []
        // If an error occurs, collect it and keep going
        // A conslidated error will be thrown at the end of propagation
        Array.from(this.dependents).forEach(dependent => {
          try {
            if (batcher) batcher.add(dependent)
            else dependent.trigger()
          } catch (error) { errorList.push(error) }
        })
        // If any errors occured during propagation
        // consolidate and throw them
        if (errorList.length === 1) {
          throw errorList[0]
        } else if (errorList.length > 1) {
          const errorMessage = 'Multiple errors from signal write'
          throw new CompoundError(errorMessage, errorList)
        }
        return output
      },

      // Used by observers to remove themselves from this as dependents
      // Also removesSelf from any owners if there are no more dependents
      removeDependent (dependent) {
        this.dependents.delete(dependent)
        if (this.dependents.size === 0) this.removeSelf()
      }

    }

    // The interface function returned to the user to utilize the signal
    // This is done to abstract away the messiness of how the signals work
    // Should contain no additional functionality and be purely syntactic sugar
    const signalInterface = function (value) {
      // An empty call is treated as a read
      if (arguments.length === 0) return signalCore.read()
      // A non empty call is treated as a write
      return signalCore.write(value)
    }

    // Register the Signal for debugging/typechecking purposes
    coreExtractor.set(signalInterface, signalCore)
    Signals.add(signalInterface)

    // Initialize with the provided value before returning
    signalInterface(initialValue)
    return signalInterface
  }
};

// Reactors are observable object proxies
// - They mostly function transparently passing calls to the internal object
// - The main difference is that they track and notify Observers automatically
// - Any object returned from reading a property is itself wrapped in a Reactor
// - Setting a property as a Defintion converts it into a getter instead
// When a Reactor property is read by an Observer it saves it as a dependent
// When a Reactor property is updated it automatically notifies dependents
// -----------------------------------------------------------------------------
// Examples
// let a = new Reactor()          Initializes a new empty Reactor object
// a.foo = 2
// a.foo                          Returns 2 as expected
// a.bar = define(function() {    Sets a dynamic getter using defineProperty
//   return this.foo;
// });
// let b = new Reactor({          Wraps an existing object into a Reactor
//   quu: "mux"
//   moo: {
//     cheese: "banana"
//   }
// })
// WeakSet of all Reactors to check if something is a Reactor
// Need to implement it this way because you can check instanceof Proxies
const Reactors = new WeakSet()
class Reactor {
  constructor (initializedSource) {
    // Trying to reactor map a reactor does
    if (Reactors.has(initializedSource)) return initializedSource

    // Check to see if we've wrapped this object before
    // This allows consistency of dependencies with repeated read calls
    const existingReactor = reactorCache.get(initializedSource)
    if (existingReactor) return existingReactor

    // The source is the internal proxied object
    // If no source is provided then provide a new default object
    if (arguments.length === 0) initializedSource = {}

    // The "guts" of a Reactor containing properties and methods
    // All actual functionality & state should be built into the core
    // Should be completely agnostic to syntactic sugar
    const reactorCore = {
      source: initializedSource,
      selfSignal: new Signal(null),

      // Function calls on reactor properties are automatically batched
      // This allows compound function calls like "Array.push"
      // to only trigger one round of observer updates
      apply (thisArg, argumentsList) {
        return batch(() => {
          // For native object methods which cant use a Proxy as `this`
          // try again with the underlying object
          // Some limitations if the failed attempt has side effects this will double up
          // Also this still wont fix being unable to pass the proxy to static methods
          // `proxiedMap.keys()` will work because keys gets wrapped by this handler
          // `Map.prototype.keys.call(proxiedMap)` won't work because it doesnt get wrapped
          try {
            return Reflect.apply(this.source, thisArg, argumentsList)
          } catch (error) {
            if (error.name === 'TypeError') {
              const core = coreExtractor.get(thisArg)
              if (typeof core !== 'undefined') {
                // Note that this.source and core.source are different
                // core.source is the underlying object
                // this.source is the function which is being called with the object as `this`
                return Reflect.apply(this.source, core.source, argumentsList)
              }
            }
            // If any other type of error, or if there's nothing to unwrap throw error anyway
            throw error
          }
        })
      },

      // Instead of reading a property directly
      // Reactor properties are read through a trivial Signal
      // This handles dependency tracking and sub-object Reactor wrapping
      // Accessor Signals need to be stored to allow persistent dependencies
      getSignals: {},
      get (property, receiver) {
        // Disable unnecessary wrapping for unmodifiable properties
        // Needed because Array prototype checking fails if wrapped
        // Specificaly [].map();
        const descriptor = Object.getOwnPropertyDescriptor(
          this.source, property
        )
        if (descriptor && !descriptor.writable && !descriptor.configurable) {
          return Reflect.get(this.source, property, receiver)
        }
        // Lazily instantiate accessor signals
        this.getSignals[property] =
          // Need to use hasOwnProperty instead of a normal get to avoid
          // the basic Object prototype properties
          // e.g. constructor
          Object.prototype.hasOwnProperty.call(this.getSignals, property)
            ? this.getSignals[property]
            : new Signal()
        // User accessor signals to give the actual output
        // This enables automatic dependency tracking
        const signalCore = coreExtractor.get(this.getSignals[property])
        signalCore.removeSelf = () => delete this.getSignals[property]
        const currentValue = (() => {
          // Handle getters which require hidden/native properties
          // If putting the proxy as `this` fails then reveal the underlying object
          // There are limitations though
          // - If the getter have any side effects on error this will trigger them twice
          // - If the getter also reads other public properties this will not build dependencies
          // For example this will fail to build a dependency on `this.normalProp` if proxied
          // get (prop) {
          //   return this.#hiddenProp + this.normalProp
          // }
          // This is sort of a necessary limitation of dealing with native code though
          // Better than failing overall?
          // An alternative is to detect the "nativeness" of an object and pass through
          // That seems quite messy though
          try {
            return Reflect.get(this.source, property, receiver)
          } catch (error) {
            // We trim to TypeError to minimize unnecessary double retries to actual proxy problems
            // but it could still happen for other TypeErrors
            if (error.name === 'TypeError') return Reflect.get(this.source, property, this.source)
            throw error
          }
        })()
        signalCore.value = currentValue
        return signalCore.read()
      },

      // Notifies dependents of the defined property
      // Also translates Definitions sets into getter methods
      // We trap defineProperty instead of set because it avoids the ambiguity
      // of access through the prototype chain
      defineProperty (property, descriptor) {
        // Automatically transform a Definition set into a getter
        // Identical to calling Object.defineProperty with a getter directly
        // This is just syntactic sugar and does not provide new functionality
        if (descriptor.value instanceof Definition) {
          const newDescriptor = {
            get: descriptor.value.definition,
            // Copy the prexisting configurable and enumerable properties
            // Default to true if undefined
            // Apparent bug in v8 where you are unable to modify
            // the descriptor with it false
            // https://bugs.chromium.org/p/v8/issues/detail?id=7884
            configurable: (descriptor.configurable === undefined
              ? true
              : descriptor.configurable
            ),
            enumerable: (descriptor.enumerable === undefined
              ? true
              : descriptor.enumerable
            )
          }
          // Translate the writable property into the existence of a setter
          // Default to true
          if (descriptor.writable || descriptor.writable === undefined) {
            newDescriptor.set = (value) => {
              delete this.source[property]
              this.source[property] = value
            }
          }
          descriptor = newDescriptor
        };
        const didSucceed = Reflect.defineProperty(
          this.source, property, descriptor
        )
        // Trigger dependents before returning
        this.trigger(property)
        return didSucceed
      },

      // Transparently delete the property but also trigger dependents
      deleteProperty (property) {
        const didSucceed = Reflect.deleteProperty(this.source, property)
        this.trigger(property)
        return didSucceed
      },

      // Have a map of dummy Signals to keep track of dependents on has
      // We don't resuse the get Signals to avoid triggering getters
      hasSignals: {},
      has (property) {
        // Lazily instantiate has signals
        this.hasSignals[property] =
          // Need to use hasOwnProperty instead of a normal get to avoid
          // the basic Object prototype properties
          // e.g. constructor
          Object.prototype.hasOwnProperty.call(this.hasSignals, property)
            ? this.hasSignals[property]
            : new Signal(null)
        // User accessor signals to give the actual output
        // This enables automatic dependency tracking
        const signalCore = coreExtractor.get(this.hasSignals[property])
        signalCore.removeSelf = () => delete this.hasSignals[property]
        const currentValue = Reflect.has(this.source, property)
        signalCore.value = currentValue
        return signalCore.read()
      },

      // Subscribe to the overall reactor by reading the dummy signal
      ownKeys () {
        const currentKeys = Reflect.ownKeys(this.source)
        const signalCore = coreExtractor.get(this.selfSignal)
        signalCore.value = currentKeys
        return signalCore.read()
      },

      // Force dependencies to trigger
      // Hack to do this by trivially "redefining" the signal
      // The proper accessor will be materialized "just in time" on the getter
      // so it doesn't matter that we're swapping it with a filler Symbol
      trigger (property) {
        // Calculate the actual new values observers will receive
        // This avoids redundant triggering if they were the same
        const getValue = Reflect.get(this.source, property)
        const hasValue = Reflect.has(this.source, property)
        // For ownKeys you need to manually calculate the set comparison
        const currentOwnKeysValue = Reflect.ownKeys(this.source)
        const oldOwnKeysValue = coreExtractor.get(this.selfSignal).value
        const ownKeysChanged = (() => {
          const currentSet = new Set(currentOwnKeysValue)
          const oldSet = new Set(oldOwnKeysValue)
          if (currentSet.size !== oldSet.size) return true
          for (const key of currentSet) {
            if (!oldSet.has(key)) return true
          }
          return false
        })()
        // Batch together to avoid redundant triggering for shared observers
        batch(() => {
          if (this.getSignals[property]) this.getSignals[property](getValue)
          if (this.hasSignals[property]) this.hasSignals[property](hasValue)
          if (ownKeysChanged) this.selfSignal(currentOwnKeysValue)
        })
      }
    }

    // The interface proxy returned to the user to utilize the Reactor
    // This is done to abstract away the messiness of how the Reactors work
    // Should contain no additional functionality and be purely syntactic sugar
    const reactorInterface = new Proxy(reactorCore.source, {
      apply (target, thisArg, argumentsList) {
        if (target === reactorCore.source) {
          return reactorCore.apply(thisArg, argumentsList)
        }
        throw new Error('Proxy target does not match initialized object')
      },
      get (target, property, receiver) {
        if (target === reactorCore.source) {
          return reactorCore.get(property, receiver)
        }
        throw new Error('Proxy target does not match initialized object')
      },
      defineProperty (target, property, descriptor) {
        if (target === reactorCore.source) {
          return reactorCore.defineProperty(property, descriptor)
        };
        throw new Error('Proxy target does not match initialized object')
      },
      deleteProperty (target, property) {
        if (target === reactorCore.source) {
          return reactorCore.deleteProperty(property)
        }
        throw new Error('Proxy target does not match initialized object')
      },
      has (target, property) {
        if (target === reactorCore.source) {
          return reactorCore.has(property)
        }
        throw new Error('Proxy target does not match initialized object')
      },
      ownKeys (target) {
        if (target === reactorCore.source) {
          return reactorCore.ownKeys()
        };
        throw new Error('Proxy target does not match initialized object')
      }
    })
    // Register the reactor for debugging/typechecking purposes
    coreExtractor.set(reactorInterface, reactorCore)
    Reactors.add(reactorInterface)
    reactorCache.set(initializedSource, reactorInterface)
    return reactorInterface
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
// let a = new Signal(1);
// let b = new Reactor();
// b.foo = "bar"
// let observer = new Observer(() => {        This will trigger whenever
//   console.log("a is now " + a());          a or b.foo are updated
//   console.log("b.foois now " + b.foo);
// })
// observer()
// a(2);                                      This will trigger an update
//
// observer.stop();                           This will block triggers
// b.foo = "cheese"                           No trigger since we stopped it
//
// observer.start();                          Will rerun the function
//                                            and allow updates again
//
// observer.start();                          Does nothing since already started
const observerMembership = new WeakSet() // To check if something is an Observer
class Observer {
  constructor (execute) {
    // Parameter validation
    if (typeof execute !== 'function') {
      throw new TypeError('Cannot create observer with a non-function')
    }

    // Internal engine of an Observer for how it works
    // All actual functionality & state should be built into the core
    // Should be completely agnostic to syntactic sugar
    const observerCore = {
      // Core function the observer is wrapping
      execute,
      // Whether automatic triggers will be accepted
      awake: false,
      // The Signals the execution block reads from
      // Cleared and rebuilt at every trigger
      // Store dependencies weakly to avoid memory loops
      // They're only stored to break the connection later anyway
      dependencies: new WeakRefSet(),
      // Stored return value of the last successful execute
      // Stored in a Signal which makes it observable itself
      value: new Signal(),
      // Flag on whether this is a unobserve block
      // Avoids creating dependencies in that case

      // Symmetrically removes dependencies
      clearDependencies () {
        // Go upstream to break the connection
        if (this.dependencies === null) return
        this.dependencies.forEach(dependency => {
          dependency.removeDependent(this)
        })
        // Drop own references
        this.dependencies = new WeakRefSet()
      },

      // External call to add a dependency
      // Wrapped to to encapsulate implementation
      addDependency (dependency) {
        this.dependencies.add(dependency)
      },

      // Trigger the execute block and build dependencies
      // Does nothing if observer is asleep
      trigger () {
        if (this.awake) {
          this.clearDependencies()
          // Put self on the dependency stack
          // So any signals read by execute know who is calling
          dependencyStack.push(this)
          let result
          // Wrap execute in a try block so that
          // dependency stack is popped even if an error is occured
          // Allows users to catch errors themselves and handle them
          try {
            result = this.execute.apply(null, this.context)
          } finally {
            dependencyStack.pop()
          }
          // Store the result as a subscribable signal
          // This will trigger any downstream observers
          // which depend on this observers value
          this.value(result)
          return this.value()
        }
      },

      // Redefines the observer with a new exec function
      // Maintains the context, Signal dependents, and awake status
      redefine (newExecute) {
        if (typeof newExecute !== 'function') {
          throw new TypeError('Cannot create observer with a non-function')
        }
        this.clearDependencies()
        this.execute = newExecute
        // If awake this will update the value Signal and notify observers downstream
        // If alseep this will correctly do nothing leaving value to the last triggered value
        this.trigger()
      },

      // Pause the observer preventing further triggers
      // Returns false if it was already asleep
      // Returns true if it was awake
      stop () {
        if (!this.awake) return false
        this.awake = false
        this.clearDependencies()
        return true
      },

      // Restart the observer if it is not already awake
      // Returns false is already awake
      // Returns true if it was woken up
      start () {
        if (this.awake) return false
        this.awake = true
        this.trigger()
        return true
      }

    }

    // Public interace to hide the ugliness of how observers work
    // An empty call force triggers the block and turns it on
    // A call with arguments gets those arguments passed as a context
    // for that and future retriggers
    const observerInterface = function () {
      if (arguments.length > 0) observerCore.context = arguments
      observerCore.awake = true
      return observerCore.trigger()
    }
    observerInterface.stop = () => observerCore.stop()
    observerInterface.start = (force) => observerCore.start(force)
    observerInterface.trigger = () => observerCore.trigger()
    // Expose the wrapped execute function
    // Setting it keeps the context and dependents
    // but puts the observer back to sleep
    Object.defineProperty(observerInterface, 'execute', {
      get () { return observerCore.execute },
      set (newValue) { return observerCore.redefine(newValue) }// TODO check return value
    })
    // Allow reads of the last return value of execute
    // As a Signal this itself is observable and
    // builds dependencies if done within another observer
    Object.defineProperty(observerInterface, 'value', {
      get () { return observerCore.value() }
    })

    // Register the observer for isObserver checking later
    coreExtractor.set(observerInterface, observerCore)
    observerMembership.add(observerInterface)

    // Does not trigger on initialization until () or .start() are called
    return observerInterface
  }
}
const observe = (execute) => {
  return new Observer(execute)
}

const isObserver = (candidate) => observerMembership.has(shuck(candidate))

// Unobserve is syntactic sugar to create a dummy observer to block the triggers
// While also returning the contents of the block
const unobserve = (execute) => {
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
const batch = (execute) => {
  let result
  if (batcher === null) {
    // Set a global batcher so signals know not to trigger observers immediately
    // Using a set allows the removal of redundant triggering in observers
    batcher = new Set()
    let batchedObservers = []
    // Execute the given block and collect the triggerd observers
    try {
      result = execute()
    } finally {
      // Clear the batching mode
      // This needs to be done before observer triggering in case any observers
      // subsequently themselves trigger batches
      // This also needs to be done first before throwing errors
      // Otherwise the thrown errors will mean we never unset the batcher
      // This will cause subsequent triggers to get stuck in this dead batcher
      // Never to be executed
      batchedObservers = Array.from(batcher) // Make a copy to freeze it
      batcher = null
    }

    // Trigger the collected observers
    // If an error occurs, collect it and keep going
    // A conslidated error will be thrown at the end of propagation
    const errorList = []
    batchedObservers.forEach(observer => {
      try { observer.trigger() } catch (error) { errorList.push(error) }
    })

    // If any errors occured during propagation
    // consolidate and throw them
    if (errorList.length === 1) {
      throw errorList[0]
    } else if (errorList.length > 1) {
      const errorMessage = 'Multiple errors from batched reactor observers'
      throw new CompoundError(errorMessage, errorList)
    }
  // No need to do anything if batching is already taking place }
  } else {
    result = execute()
  }
  return result
}

// Method for extracting a the internal object from the Reactor
const shuck = (reactor) => {
  const core = coreExtractor.get(reactor)
  if (core) return core.source
  // In this case its a normal object. No need to shuck
  return reactor
}

// Custom Error to consolidate multiple errors together
class CompoundError extends Error {
  constructor (message, errorList) {
    // Flatten any compound errors in the error list
    errorList = errorList.flatMap(error => {
      if (error instanceof CompoundError) return error.errorList
      return error
    })
    // Build the message to display all the component errors
    message = message + '\n' + errorList.length + ' errors in total'
    for (const error of errorList) {
      const errorDescription =
        error.stack != null ? error.stack : error.toString()
      message = message + '\n' + errorDescription
    }
    super(message)
    this.errorList = errorList
    this.name = this.constructor.name
    return this
  }
}

export {
  Reactor,
  isObserver,
  observe,
  unobserve,
  batch,
  shuck,
  define
}
