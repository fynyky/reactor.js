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

// Map of the external interface to the internal core for debugging
const coreExtractor = new WeakMap();
global.coreExtractor = coreExtractor;


// Definition is a shell class to identify dynamically calculated variables
// Accessed through the "define" function
// Class itself is not meant
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
global.define = define;



// Signals are functions representing values
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
class Signal {
  // Signals are made up of 2 main parts
  // - The core: The properties & methods which lets signals work
  // - The interface: The function returned to the user to use
  constructor(value) {

    // The "guts" of a signal containing properties and methods
    // All actual functionality & state should be built into the core
    // Should be completely agnostic to syntactic sugar
    const signalCore = {

      // Signal state
      value: null, // The set static value if defined
      definition: null, // The getter method if defined
      dependents: new Set(), // The Observers which rely on this Signal
      reactorCache: new WeakMap(), // Cache of objects to their reactor proxies
                                   // Allows for consistent dependency tracking
                                   // across multiple reads of the same object 

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
        let output = this.definition ? this.definition() : this.value;
        // Wrap the output in a Reactor if it's an object
        try { 
          // Check to see if we've wrapped this object before
          // This allows consistency of dependencies with repeated read calls
          let reactor = this.reactorCache.get(output);
          if (reactor) return reactor;
          // If not then wrap and store it for future reads
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
      write(value) {
        // Save the new value/definition
        this.definition = null;
        this.value = null;
        if (value instanceof Definition) this.definition = value.definition;
        else this.value = value;
        // Trigger dependents
        // Need to do an array copy to avoid an infinite loop
        // Triggering a dependent will remove it from the dependent set
        // Then re-add it when it is execute
        // This will cause the iterator to trigger again
        const errorList = [];
        // If an error occurs, collect it and keep going
        // A conslidated error will be thrown at the end of propagation
        Array.from(this.dependents).forEach(dependent => {
          try { dependent.trigger(); }
          catch(error) { errorList.push(error); }
        });
        // If any errors occured during propagation 
        // consolidate and throw them
        if (errorList.length === 1) {
          throw errorList[0];
        } else if (errorList.length > 1) {
          const errorMessage = errorList.length + " errors due to signal write";
          throw new CompoundError(errorMessage, errorList);
        }
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
    coreExtractor.set(signalInterface, signalCore);
    signalInterface(value);
    return signalInterface;
  }
};
global.Signal = Signal;



// Reactors are object proxies which allow 
class Reactor {
  constructor(source) {
    if (arguments.length === 0) source = {};    

    const reactorCore = {
      accessorSignals: {},
      get(target, property, receiver) {
        // Instead of reading the property directly
        // We read it through a trivial Signal to get dependency tracking
        this.accessorSignals[property] = this.accessorSignals[property]
          ? this.accessorSignals[property]
          : new Signal(define(() => Reflect.get(target, property, receiver)));
        return this.accessorSignals[property](); 
      },
      defineProperty(target, property, descriptor) {
        // Automatically transform definitions into getter methods
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
              delete target[property];
              target[property] = value;
            }; 
          }
          descriptor = newDescriptor;
        };
        const didSucceed = Reflect.defineProperty(target, property, descriptor);
        this.trigger(property);
        return didSucceed;
      }, 
      deleteProperty(target, property, descriptor) {
        const didSucceed = Reflect.deleteProperty(target, property);
        this.trigger(property);
        return didSucceed;
      },
      // Force dependencies to trigger
      // Hack to do this by "redefining" the signal to the same thing
      trigger(property) {
        if (this.accessorSignals[property]) {
          this.accessorSignals[property](define(() => source[property]));
        }
      }
    };

    const reactorInterface = new Proxy(source, {
      get(target, property, receiver) { 
        return reactorCore.get(target, property, receiver);
      },
      defineProperty(target, property, descriptor) {
        return reactorCore.defineProperty(target, property, descriptor);
      },
      deleteProperty(target, property) {
        return reactorCore.deleteProperty(target, property);
      }
    });
    coreExtractor.set(reactorInterface, reactorCore);
    return reactorInterface;
  }
}
global.Reactor = Reactor;



class Observer {
  constructor(execute) {
    if (typeof execute !== "function") {
      throw new TypeError("Cannot create observer with a non-function");
    }
    // Internal engine for how observers work
    const observerCore = {
      running: true,
      triggering: false,
      dependencies: new Set(),
      // Trigger the observer and find dependencies
      clearDependencies() {
        this.dependencies.forEach(dependency =>
          dependency.dependents.delete(this)
        );
        this.dependencies.clear();
      },
      trigger() {
        // Avoid infinite loops by throwing an error if we
        // try to trigger an already triggering observer
        if (this.triggering) {
          throw new ObserverLoopError(
            "observer attempted to activate itself while already executing"
          );
        }
        // Execute the observed function after setting the dependency stack
        if (this.running) {
          this.clearDependencies();
          dependencyStack.push(this);
          this.triggering = true;
          try { execute(); }
          finally { 
            dependencyStack.pop(); 
            this.triggering = false;
          }
        }
      },
      stop() {
        this.running = false;
        this.clearDependencies();
      },
      start() {
        if (!this.running) {
          this.running = true;
          this.trigger();
        }
      }
    }
    // public interace to hide the ugliness of how observers work
    const observerInterface = this;
    observerInterface.stop = () => observerCore.stop();
    observerInterface.start = () => observerCore.start();
    observerCore.trigger();
    coreExtractor.set(observerInterface, observerCore);
    return observerInterface;
  }
}
global.Observer = Observer;


class ObserverLoopError extends Error {
  constructor(...args) {
    super(...args);
    this.name = this.constructor.name;
    return this;
  }
}
global.ObserverLoopError = ObserverLoopError

// Custom Error class to consolidate multiple errors together
class CompoundError extends Error {
  constructor(message, errorArray) {
    // Build the message to display all the component errors
    const errors = errorArray;
    for (let error of errors) {
      const errorDescription =
        error.stack != null ? error.stack : error.toString();
      message = message + "\n" + errorDescription;
    }
    super(message);
    this.name = this.constructor.name;
    return this;
  }
}
global.CompoundError = CompoundError;
