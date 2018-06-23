// Constants
const SIGNAL = "SIGNAL";
const OBSERVER = "OBSERVER";

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


class Definition {
  constructor(definition) {
    if (typeof definition === "function") {
      this.definition = definition;
      return;
    }
    throw new TypeError("Cannot create definition with a non-function");
  }
}
const define = (definition) => new Definition(definition);
global.define = define;


class Signal {
  constructor(value) {

    const signalCore = {

      // Signal state
      value: null,
      definition: null,
      dependents: new Set(),
      reactorCache: new WeakMap(),

      read() {
        const dependent = dependencyStack[dependencyStack.length - 1];
        if (dependent) {
          this.dependents.add(dependent);
          dependent.dependencies.add(this);
        }
        // return the appropriate static or calculated value
        let output = this.definition ? this.definition() : this.value;
        // // Wrap the output in a reactor if it's an object
        try { 
          // Check to see if we've wrapped this object before
          // This allows consistency of dependencies with repeated read calls
          let reactor = this.reactorCache.get(output);
          if (reactor) return reactor;
          // If not then wrap and store it for future retrieves
          reactor = new Reactor(output);
          this.reactorCache.set(output, reactor);
          return reactor
        }
        // TypeError means it was not an object
        catch(error) {
          if (error.name === "TypeError") return output;
          throw error;
        }
      },

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
        Array.from(this.dependents).forEach(dependent => dependent.trigger())
      }

    };

    const signalInterface = function(value) {
      if (arguments.length === 0) return signalCore.read();
      return signalCore.write(value);
    };
    coreExtractor.set(signalInterface, signalCore);
    signalInterface(value);
    return signalInterface;
  }
};
global.Signal = Signal;



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
      dependencies: new Set(),
      // Trigger the observer and find dependencies
      trigger() {
        // clear old dependencies
        this.dependencies.forEach(dependency =>
          dependency.dependents.delete(this)
        );
        this.dependencies.clear();
        // Execute the observed function after setting the dependency stack
        dependencyStack.push(this);
        try { execute(); }
        finally { dependencyStack.pop(); }
      }
    }
    // public interace to hide the ugliness of how observers work
    const observerInterface = this;
    observerCore.trigger();
    coreExtractor.set(observerInterface, observerCore);
    return observerInterface;
  }
}
global.Observer = Observer;



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
