// In Node.js, Reactor is packaged into a module
// In the browser, Reactor is bound directly to the window namespace
const global =
  typeof exports !== "undefined" && exports !== null ? exports : this;

// Global stack to automatically track dependencies
// - When a signal is updated, it first puts itself on the dependency stack
// - When a signal is read, it checks the top of the stack to see who is reading
// - The reader gets added as a dependent of the readee
// - The readee gets added as a dependency of the reader
// - When the signal evaluation is done, the signal pops itself off the stack
// The stack is used to track the latest signal caller automaticaly
// Using a stack allows nested signals to function correctly
const dependencyStack = [];

// Allows "protected" variables by letting Signals/Reactors/Observers unwrap
// each others interfaces to access internal core variables
// In the constructor of each of them, they will map their external interfaces
// to their internal cores
const coreExtractor = new WeakMap();

// A batcher is used to postpone observer triggers and batch them together
// When "batch" is called it adds sets a batcher to this global variable
// When a Signal is updated it checks if a batcher is set
// If it is, it adds that observer to this set instead of triggering it
// At the end of the exeution, the batch call then calls all the observers 
// Then clears the batcher again
let batcher = null;

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
  constructor(definition) {
    if (typeof definition === "function") {
      this.definition = definition;
      return this;
    }
    throw new TypeError("Cannot create definition with a non-function");
  }
}
// Expose a define "keyword" instead of the class itself
// This seems nicer syntactic sugar than "new Definition(...)" each time
const define = (definition) => new Definition(definition);



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
const Signals = new WeakSet();
class Signal {
  // Signals are made up of 2 main parts
  // - The core: The properties & methods which lets signals work
  // - The interface: The function returned to the user to use
  constructor(initialValue) {

    // The "guts" of a Signal containing properties and methods
    // All actual functionality & state should be built into the core
    // Should be completely agnostic to syntactic sugar
    const signalCore = {

      // Signal state
      value: null, // The set value
      dependents: new Set(), // The Observers which rely on this Signal
      reactorCache: new WeakMap(), // Cache of objects to their reactor proxies
                                   // Allows for consistent dependency tracking
                                   // across multiple reads of the same object
      removeSelf: (() => {}), // callback set by parent Reactor to allow removal
                              // Used to delete Signals with no dependents
                              // To reduce memory leaks

      // Life of a read
      // - check to see who is asking
      // - register them as a dependent and register self as their dependency
      // - return the appropriate static or dynamic value
      // - wrap the result in a Reactor if its an object
      read() {
        // Check the global stack for the most recent observer being updated
        // Assume this is the caller and set it as a dependent
        // Symmetrically register dependent/dependency relationship
        const dependent = dependencyStack[dependencyStack.length - 1];
        if (dependent) {
          this.dependents.add(dependent);
          dependent.dependencies.add(this);
        }
        // Return the appropriate static or calculated value
        let output = (this.value instanceof Definition) 
          ? this.value.definition() 
          : this.value;
        // Wrap the output in a Reactor if it's an object
        // No need to wrap it if its already a Reactor
        if (Reactors.has(output)) return output;
        // Check to see if we've wrapped this object before
        // This allows consistency of dependencies with repeated read calls
        let reactor = this.reactorCache.get(output);
        if (reactor) return reactor;
        // If not then wrap and store it for future reads
        try { 
          reactor = new Reactor(output);
          this.reactorCache.set(output, reactor);
          return reactor;
        }
        // Assume TypeError means it was not an object
        // In that case just return the plain output
        catch(error) {
          if (error.name === "TypeError") return output;
          throw error;
        }
      },

      // Life of a write
      // - If the new value is a Definition then save it as a getter
      // - Otherwise just store the provided value
      // - Trigger any dependent Observers while collecting errors thrown
      // - Throw a CompoundError if necessary
      write(newValue) {
        if (this.value === newValue) return (this.value = newValue)
        // Save the new value/definition
        const output = (this.value = newValue);
        // Trigger dependents
        // Need to do an array copy to avoid an infinite loop
        // Triggering a dependent will remove it from the dependent set
        // Then re-add it when it is execute
        // This will cause the iterator to trigger again
        const errorList = [];
        // If an error occurs, collect it and keep going
        // A conslidated error will be thrown at the end of propagation
        Array.from(this.dependents).forEach(dependent => {
          try { 
            if (batcher) batcher.add(dependent);
            else dependent.trigger();
          }
          catch(error) { errorList.push(error); }
        });
        // If any errors occured during propagation 
        // consolidate and throw them
        if (errorList.length === 1) {
          throw errorList[0];
        } else if (errorList.length > 1) {
          const errorMessage = "Multiple errors from signal write";
          throw new CompoundError(errorMessage, errorList);
        }
        return output;
      },

      // Used by observers to remove themselves from this as dependents
      // Also removesSelf from any owners if there are no more dependents
      removeDependent(dependent) {
        this.dependents.delete(dependent);
        if (this.dependents.size === 0) this.removeSelf();
      }

    };

    // The interface function returned to the user to utilize the signal
    // This is done to abstract away the messiness of how the signals work
    // Should contain no additional functionality and be purely syntactic sugar
    const signalInterface = function(value) {
      // An empty call is treated as a read
      if (arguments.length === 0) return signalCore.read();
      // A non empty call is treated as a write
      return signalCore.write(value);
    };

    // Register the Signal for debugging/typechecking purposes
    coreExtractor.set(signalInterface, signalCore);
    Signals.add(signalInterface);

    // Initialize with the provided value before returning
    signalInterface(initialValue);
    return signalInterface;

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
const Reactors = new WeakSet();
class Reactor {
  constructor(initializedSource) {

    // The source is the internal proxied object
    // If no source is provided then provide a new default object
    if (arguments.length === 0) initializedSource = {};    

    // The "guts" of a Reactor containing properties and methods
    // All actual functionality & state should be built into the core
    // Should be completely agnostic to syntactic sugar
    const reactorCore = {
      source: initializedSource,
      selfSignal: new Signal(null),

      // Function calls on reactor properties are automatically batched
      // This allows compound function calls like "Array.push"
      // to only trigger one round of observer updates
      apply(thisArg, argumentsList) {
        return batch(() => Reflect.apply(this.source, thisArg, argumentsList));
      },

      // Instead of reading a property directly
      // Reactor properties are read through a trivial Signal
      // This handles dependency tracking and sub-object Reactor wrapping
      // Accessor Signals need to be stored to allow persistent dependencies
      getSignals: {},
      get(property, receiver) {
        // Disable unnecessary wrapping for unmodifiable properties
        // Needed because Array prototype checking fails if wrapped
        // Specificaly [].map();
        const descriptor = Object.getOwnPropertyDescriptor(
          this.source, property
        );
        if (descriptor && !descriptor.writable && !descriptor.configurable ) {
          return Reflect.get(this.source, property, receiver);
        }
        // Lazily instantiate accessor signals
        this.getSignals[property] = 
          // Need to use hasOwnProperty instead of a normal get to avoid
          // the basic Object prototype properties 
          // e.g. constructor
          this.getSignals.hasOwnProperty(property)
            ? this.getSignals[property]
            : new Signal();
        // User accessor signals to give the actual output
        // This enables automatic dependency tracking
        const signalCore = coreExtractor.get(this.getSignals[property]);
        signalCore.removeSelf = () => delete this.getSignals[property];
        const currentValue = Reflect.get(this.source, property, receiver);
        signalCore.value = currentValue;
        return signalCore.read();
      },

      // Notifies dependents of the defined property
      // Also translates Definitions sets into getter methods
      // We trap defineProperty instead of set because it avoids the ambiguity
      // of access through the prototype chain
      defineProperty(property, descriptor) {
        // Automatically transform a Definition set into a getter
        // Identical to calling Object.defineProperty with a getter directly
        // This is just syntactic sugar and does not provide new functionality
        if (descriptor.value instanceof Definition) {
          let newDescriptor = { 
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
          };
          // Translate the writable property into the existence of a setter
          // Default to true
          if (descriptor.writable || descriptor.writable === undefined) {
            newDescriptor.set = (value) => {
              delete this.source[property];
              this.source[property] = value;
            }; 
          }
          descriptor = newDescriptor;
        };
        const didSucceed = Reflect.defineProperty(
          this.source, property, descriptor
        );
        // Notify dependents before returning
        this.trigger(property);
        return didSucceed;
      }, 

      // Transparently delete the property but also notify dependents
      deleteProperty(property) {
        const didSucceed = Reflect.deleteProperty(this.source, property);
        this.trigger(property);
        return didSucceed;
      },

      // Have a map of dummy Signals to keep track of dependents on has
      // We don't resuse the get Signals to avoid triggering getters
      hasSignals: {},
      has(property) {
        // Lazily instantiate has signals
        this.hasSignals[property] = 
          // Need to use hasOwnProperty instead of a normal get to avoid
          // the basic Object prototype properties 
          // e.g. constructor
          this.hasSignals.hasOwnProperty(property)
            ? this.hasSignals[property]
            : new Signal(null);
        // User accessor signals to give the actual output
        // This enables automatic dependency tracking
        const signalCore = coreExtractor.get(this.hasSignals[property]);
        // signalCore.removeSelf = () => delete this.getSignals[property];
        signalCore.removeSelf = () => delete this.hasSignals[property];
        const currentValue = Reflect.has(this.source, property);
        signalCore.value = currentValue;
        return signalCore.read();
      },

      // Subscribe to the overall reactor by reading the dummy signal
      ownKeys() {
        const currentKeys = Reflect.ownKeys(this.source);
        const signalCore = coreExtractor.get(this.selfSignal);
        signalCore.value = currentKeys;
        return signalCore.read();
      },

      // Force dependencies to trigger
      // Hack to do this by trivially "redefining" the signal
      // The proper accessor will be materialized "just in time" on the getter
      // so it doesn't matter that we're swapping it with a filler Symbol
      trigger(property) {
        // Calculate the actual new values observers will receive
        // This avoids redundant triggering if they were the same
        const getValue = Reflect.get(this.source, property);
        const hasValue = Reflect.has(this.source, property);
        // For ownKeys you need to manually calculate the set comparison
        const currentOwnKeysValue = Reflect.ownKeys(this.source);
        const oldOwnKeysValue = coreExtractor.get(this.selfSignal).value;
        const ownKeysChanged = (() => {
          const currentSet = new Set(currentOwnKeysValue);
          const oldSet = new Set(oldOwnKeysValue);
          if (currentSet.size !== oldSet.size) return true;
          for (let key of currentSet) {
            if (!oldSet.has(key)) return true;
          }
          return false;
        })();
        // Batch together to avoid redundant triggering for shared observers
        batch(() => {
          if (this.getSignals[property]) this.getSignals[property](getValue);
          if (this.hasSignals[property]) this.hasSignals[property](hasValue);
          if (ownKeysChanged) this.selfSignal(currentOwnKeysValue);
        });
      }
    };

    // The interface proxy returned to the user to utilize the Reactor
    // This is done to abstract away the messiness of how the Reactors work
    // Should contain no additional functionality and be purely syntactic sugar
    const reactorInterface = new Proxy(reactorCore.source, {
      apply(target, thisArg, argumentsList) {
        if (target === reactorCore.source) {
          return reactorCore.apply(thisArg, argumentsList);
        }
        throw new Error("Proxy target does not match initialized object");
      },
      get(target, property, receiver) {
        if (target === reactorCore.source) {
          return reactorCore.get(property, receiver);
        }
        throw new Error("Proxy target does not match initialized object");
      },
      defineProperty(target, property, descriptor) {
        if (target === reactorCore.source) {
          return reactorCore.defineProperty(property, descriptor);
        };
        throw new Error("Proxy target does not match initialized object");
      },
      deleteProperty(target, property) {
        if (target === reactorCore.source) {
          return reactorCore.deleteProperty(property);
        }
        throw new Error("Proxy target does not match initialized object");
      },
      has(target, property){
        if (target === reactorCore.source) {
          return reactorCore.has(property);
        }
        throw new Error("Proxy target does not match initialized object");
      },
      ownKeys(target){
        if (target === reactorCore.source) {
          return reactorCore.ownKeys();
        };
        throw new Error("Proxy target does not match initialized object");
      }
    });
    // Register the reactor for debugging/typechecking purposes
    coreExtractor.set(reactorInterface, reactorCore);
    Reactors.add(reactorInterface);
    return reactorInterface;

  }
}
global.Reactor = Reactor;


// Observers are functions which automatically track their dependencies
// They are triggered first on initialization
// They are automatically retriggered whenever a dependency is updated
// Observers can be stopped and restarted
// Starting after stopping causes the Observer to execute again
// Starting does nothing if an Observer is already running
// To prevent infinite loops an error is thrown if an Observer triggers itself 
// -----------------------------------------------------------------------------
// Examples
// let a = new Signal(1);
// let b = new Reactor();
// b.foo = "bar"
// let observer = new Observer(() => {        This will trigger whenever
//   console.log("a is now " + a());          a or b.foo are updated
//   console.log("b.foois now " + b.foo);
// })
// a(2);                                      This will trigger an update
// 
// observer.stop();                           This will block triggers
// b.foo = "cheese"                           No trigger since we stopped it
// 
// observer.start();                          Will rerun the function
//                                            and allow updates again
// 
// observer.start();                          Does nothing since already started
const observerRegistry = new Map();
class Observer {
  constructor(key, execute, unobserve) {

    // The triggered and observed block of code
    if (typeof execute !== "function") {
      throw new TypeError("Cannot create observer with a non-function");
    }

    // Check to see if there's an existing observer to override
    // instead of making a new one
    if (typeof key !== "undefined" && key !== null) {
      const existingObserver = observerRegistry.get(key);
      if (existingObserver) return existingObserver(execute);
    }

    // Internal engine of an Observer for how it works
    // All actual functionality & state should be built into the core
    // Should be completely agnostic to syntactic sugar
    const observerCore = {
      execute: execute,
      unobserve, unobserve, // flag on whether this is a unobserve block
                            // Avoids creating dependencies in that case 
      running: true, // Whether further triggers and updates are allowed
      triggering: false, // Whether the block is currently executing
                         // prevents further triggers
      dependencies: new Set(), // The Signals the execution block reads from
                               // at last trigger

      // Symmetrically removes dependencies 
      clearDependencies() {
        this.dependencies.forEach(dependency =>
          dependency.removeDependent(this)
        );
        this.dependencies.clear();
      },

      // Trigger the execution block and find its dependencies
      trigger() {
        // Avoid infinite loops by throwing an error if we
        // try to trigger an already triggering observer
        if (this.triggering) {
          throw new LoopError(
            "observer attempted to activate itself while already executing"
          );
        }
        // Execute the observed function after setting the dependency stack
        if (this.running) {
          this.clearDependencies();
          if (unobserve) dependencyStack.push(null);
          else dependencyStack.push(this);
          this.triggering = true;
          try { this.execute(); }
          finally { 
            dependencyStack.pop(); 
            this.triggering = false;
          }
        }
      },

      // Pause the observer preventing further triggers
      stop() {
        this.running = false;
        this.clearDependencies();
      },

      // Restart the observer if it is not already running
      start() {
        if (!this.running) {
          this.running = true;
          this.trigger();
        }
      }

    };

    // Public interace to hide the ugliness of how observers work
    const observerInterface = function(execute) {
      // AN empty call is a manual "one time" trigger of the block
      if (arguments.length === 0) return observerCore.execute();
      // A non-empty call is used to redfine the observer 
      if (typeof execute !== "function") {
        throw new TypeError("Cannot create observer with a non-function");
      }
      // reset all the core
      observerCore.clearDependencies();
      observerCore.running = true;
      observerCore.triggering = false;
      observerCore.execute = execute;
      observerCore.trigger();
      return observerInterface;
    };
    observerInterface.stop = () => observerCore.stop();
    observerInterface.start = () => observerCore.start();

    // Register the observer for potential overriding later
    coreExtractor.set(observerInterface, observerCore);
    if (typeof key !== "undefined") {
      observerRegistry.set(key, observerInterface);
    }

    // Trigger once on initialization
    observerCore.trigger();
    return observerInterface;

  }
}
const observe = (arg1, arg2) => {
  // Argument parsing
  // If only one argument is given then it needs to be an execute block
  // If 2 are presented then the first one is treated as an override key
  let key;
  let execute;
  if (typeof arg2 === "undefined") {
    execute = arg1;
  } else {
    key = arg1;
    execute = arg2;
  }
  return new Observer(key, execute);
};
global.observe = observe;


// Unobserve is syntactic sugar to create a dummy observer to block the triggers
// While also returning the contents of the block 
const unobserve = (execute) => {
  let output;
  const observer = new Observer(null, () => {
    output = execute();
  }, true);
  return output;
};
global.unobserve = unobserve;


// Method for allowing users to batch multiple observer updates together
const batch = (execute) => {
  let result;
  if (batcher === null) {
    // Set a global batcher so signals know not to trigger observers immediately
    // Using a set allows the removal of redundant triggering in observers
    batcher = new Set();
    // Execute the given block and collect the triggerd observers
    result = execute();

    // Clear the batching mode
    // This needs to be done before observer triggering in case any observers
    // subsequently themselves trigger batches
    // This also needs to be done first before throwing errors
    // Otherwise the thrown errors will mean we never unset the batcher
    // This will cause subsequent triggers to get stuck in this dead batcher
    // Never to be executed
    const batchedObservers = Array.from(batcher); // Make a copy to freeze it
    batcher = null;
    // Trigger the collected observers
    // If an error occurs, collect it and keep going
    // A conslidated error will be thrown at the end of propagation
    const errorList = [];
    batchedObservers.forEach(observer => {
      try { observer.trigger(); }
      catch(error) { errorList.push(error); }
    });

    // If any errors occured during propagation 
    // consolidate and throw them
    if (errorList.length === 1) {
      throw errorList[0];
    } else if (errorList.length > 1) {
      const errorMessage = "Multiple errors from batched reactor observers";
      throw new CompoundError(errorMessage, errorList);
    }
  } 
  // No need to do anything if batching is already taking place
  else result = execute();
  return result;
};
global.batch = batch;


// Custom Error class to indicate loops in observer triggering
class LoopError extends Error {
  constructor(...args) {
    super(...args);
    this.name = this.constructor.name;
    return this;
  }
}

// Custom Error class to consolidate multiple errors together
class CompoundError extends Error {
  constructor(message, errorList) {
    // Flatten any compound errors in the error list
    errorList = errorList.flatMap(error => {
      if (error instanceof CompoundError) return error.errorList;
      return error;
    });
    // Build the message to display all the component errors
    message = message + "\n" + errorList.length + " errors in total";
    for (let error of errorList) {
      const errorDescription =
        error.stack != null ? error.stack : error.toString();
      message = message + "\n" + errorDescription;
    }
    super(message);
    this.errorList = errorList;
    this.name = this.constructor.name;
    return this;
  }
}
