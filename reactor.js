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

      read() {
        const dependent = dependencyStack[dependencyStack.length - 1];
        if (dependent) {
          this.dependents.add(dependent);
          dependent.dependencies.add(this);
        }
        // return the appropriate static or calculated value
        let output = this.definition ? this.definition() : this.value;
        // // Wrap the output in a reactor if it's an object
        // try { output = new Reactor(output) }
        // catch(error) {
        //   if (error.name = "TypeError") return output;
        //   throw error;
        // }
        return output;
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
      get(property) {
        // Instead of reading the property directly
        // We read it through a trivial Signal to get dependency tracking
        this.accessorSignals[property] = this.accessorSignals[property]
          ? this.accessorSignals[property]
          : new Signal(define(() => source[property]));
        return this.accessorSignals[property](); 
      },
      set(property, value) { 
        if (value instanceof Definition) {
          return Object.defineProperty(source, property, {
            get: value.definition,
            set(setterValue) {
              delete source[property];
              source[property] = setterValue;
            },
            configurable: true,
            enumerable: true
          });
        }
        // Save the final return value for consistency with a transparent set 
        const returnValue = (source[property] = value);
        // Force dependencies to trigger before returning
        // Hack to do this by "redefining" the signal to the same thing
        if (this.accessorSignals[property]) {
          this.accessorSignals[property](define(() => source[property]));
        }
        return returnValue;
      }
    };

    const reactorInterface = new Proxy(source, {
      get(target, property, receiver) { 
        return reactorCore.get(property)
      },
      set(target, property, value, receiver) { 
        return reactorCore.set(property, value)
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
