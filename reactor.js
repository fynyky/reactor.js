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

      read() {
        if (this.definition) return this.definition();
        return this.value;
      },

      write(value) {
        this.definition = null;
        this.value = null;
        if (value instanceof Definition) this.definition = value.definition;
        else this.value = value;
      }

    };

    const signalInterface = function(value) {
      if (arguments.length === 0) return signalCore.read();
      return signalCore.write(value);
    };

    signalInterface(value);
    return signalInterface;
  }
};
global.Signal = Signal;



class Reactor {
  constructor(source) {

    if (arguments.length === 0) source = {};    

    const reactorCore = {
      get(property) { return source[property]; },
      set(property, value) { return source[property] = value; }
    };

    const reactorInterface = new Proxy(source, {
      get(target, property, receiver) { 
        return reactorCore.get(property)
      },
      set(target, property, value, receiver) { 
        return reactorCore.set(property, value)
      }
    });

    return reactorInterface;

  }
}
global.Reactor = Reactor;


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
