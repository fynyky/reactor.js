Reactor.js
==========

Reactor is a lightweight library for [reactive programming](http://en.wikipedia.org/wiki/Reactive_programming). It provides observer blocks that automatically track the reactive variables that they use and get retriggered if any of these variables are updated. This makes it easy to keep a complex data model consistent, or a user interface up to date when a model is changed.

Here's a quick example of what Reactor does:
```javascript
const reactor = new Reactor({ foo: "bar" });

observe(() => {
  console.log("foo is ", reactor.foo);
}); // prints "foo is bar"

reactor.foo = "moo"; // prints "foo is moo"
```
- You create a reactive object and an `observe` block that reads from that object. 
- The observe block executes once on initial definition and automatically tracks which reactive properties it is using. 
- Whenever the reactive property is updated, the observer is notified and executes its observed block again. 

Reactor is designed to be unobtrusive and unopinionated. 
- There is no need to manually declare listeners or bindings. Reactor automatically keeps track of all that for you. 
- It imposes no particular structure on your code. Any variable can be easily replaced with a reactive one. 
- There is no need to learn special syntax or a domain specific language. Reactors behave just like normal objects and you can observe any function.

Summary
-------

```javascript
// You can wrap any object in a Reactor
// - This lets it automatically track and notify observers
// - Sub-objects are also wrapped in Reactors recursively
const reactor = new Reactor({ 
  foo: "bar",
  outer: {
    inner: "value"
  }
});

// Reactors are mostly transparent, behaving just like a normal object
reactor.foo; // "bar"
reactor.moo = "mux";
reactor.moo; // "mux" 

// Reactors can use "define" to define a getter more conveniently 
reactor.fooAndMoo = define(() => this.foo)

// Use the "observe" function to create an observer
const observer = observe(() => {
  // Reading from a reactor property automatically saves it as a dependency
  console.log("reactor.foo is ", reactor.foo);
});

// Dependency tracking works for sub-objects as well
const innerObserver = observe(() => {
  console.log("reactor.outer.inner is ", reactor.outer.inner);
});

// Updating the property automatically notifies the observer
reactor.foo = "updated"; // prints "reactor.foo is updated"
reactor.outer.inner = "cheese" // prints "reactor.outer.inner is cheese"

// You can use "unobserve" to avoid particular dependencies in an observer
// This is useful especially when using array methods that both read and write
reactor.names = ["Alice", "Bob", "Charles", "David"];
const partialObserver = observe(() => {
  if (reactor.foo) {
    // Unobserve passes through the return value of its block
    const next = unobserve(() => reactor.names.pop());
    console.log("next ", next);
  }
}); // prints "next Alice"

reactor.foo = true; // prints "next Bob"
reactor.names.push("Elsie"); // Will not trigger the observer

// You can stop an observer by calling stop()
partialObserver.stop();
reactor.foo = true; // Will not trigger since observer is stopped

// You can restart an observer by calling start()
// This also retriggers the observed block
partialObserver.start(); // prints "next Charles"

// Start is idempotent so starting an already running observer has no effect
partialObserver.start(); // -
partialObserver.start(); // -
partialObserver.start(); // -

// You can provide a name to conveniently override old observers
// This simplifies dynamic observer creation
reactor.foo = "bar"
const firstObserver = observe("fooTracker", () => {
  console.log("first observer: ", reactor.foo);
}); // prints "first observer: bar";
reactor.foo = "moo"; // prints "first observer: moo"

const secondObserver = observe("fooTracker", () => {
  console.log("second observer: ", reactor.foo);
}); // prints "second observer: moo";
reactor.foo = "beep"; // prints "second observer: beep"

```

Comparison to other libraries
-----------------------------

Reactor is based on the same reactive principles as [Bacon.js](https://github.com/raimohanska/bacon.js) and [Knockout.js](http://knockoutjs.com/). The main difference is that Reactor is trying to be lightweight and keep the additional syntax and complexity to a minimum. Reactor sets dependencies for you automatically so there is no need to manually set subscriptions/listeners.

Compared to Knockout, Reactor does not provide semantic bindings directly to HTML. Instead, users set the appropriate HTML modifying functions as Observers.

Compared to Bacon, Reactor does not help to handle event streams.

Reactors
--------

A **Reactor** is an object wrapper which automatically tracks observers that read its properties and notifies these observers when those properties are updated.

You create a new Reactor by just calling its constructor.
```javascript
const reactor = new Reactor();
```

You can also wrap an existing object with a Reactor by passing it to the constructor. Changes to the Reactor are passed through to the underlying object.
```javascript
const reactor = new Reactor({
  foo: "bar"
});
```

Reactors behave mostly like plain javascript objects.
```javascript
const reactor = new Reactor({
  foo: "bar"
});
reactor.foo; // "bar"

// You can set and get properties as usual
reactor.cow = "moo";
reactor.cow; = "moo"

// defineProperty works normally as well
Object.defineProperty(reactor, "milk", {
  get() { return "chocolate"; }
});
reactor.milk; // "chocolate"

// delete works too
delete reactor.foo;
reactor.foo; // undefined
```

The key difference of Reactors is that they track when one of their properties is read by an observer and will notify that observer when the property is updated.

```javascript
const reactor = new Reactor({ foo: "bar" });

observe(() => {
  console.log("foo is ", reactor.foo);
}); // prints "foo is bar"

reactor.foo = "moo"; // prints "foo is moo"

Object.defineProperty(reactor, "foo", {
  get() { return "meow"; }
}); // prints "foo is meow"

delete reactor.foo; // prints "foo is undefined"
```

Tracking is property specific so observers will not trigger if a different property is updated
```javascript
const reactor = new Reactor({
  foo: "bar",
  moo: "mar"
});

observe(() => {
  console.log("foo tracker is now", reactor.foo);
}); // prints "foo tracker is now bar"

observe(() => {
  console.log("moo tracker is now", reactor.foo);
}); // prints "moo tracker is now mar"

reactor.foo = "bar2"; // prints "foo tracker is now bar2"
reactor.moo = "mar2"; // prints "moo tracker is now mar2"
reactor.goo = "goop"; // does not trigger any observers
```

If reading a Reactor's property also returns an object, that object is recursively also wrapped in a Reactor before being returned. This allows observers to tracks dependencies in nested objects easily.
```javascript
const reactor = new Reactor({
  outer: {
    inner: "cake"
  }
});

observe(() => {
  console.log("inner value is ", reactor.outer.inner);
}); // prints "inner value is cake"
```

Observers
---------

An **Observer** is a code block that re-executes when one of the reactor propeties it read from is updated.

Observers are created by using "observe" passing it a function. This function is executed once immediately on creation. 
```javascript
observe(() => {
  console.log("hello world")
}); // prints "hello world"
```

When an Observer reads a Reactor's property it gets saved as a dependent. When that property is updated it notifies the observer which re-executes its function. This happens automatically without any need to manually declare dependencies.
```javascript
const reactor = new Reactor();
observe(() => {
  console.log("reactor.foo is ", reactor.foo);
}); // prints "reactor.foo is undefined"

reactor.foo = "bar"; // prints "reactor.foo is bar";
```

An Observer's dependencies are dynamically determined. Only the dependencies actually read in the last execution of an observer can trigger it again. This means that Reactor reads that are only conditionally used will not trigger the observer unnecessarily.
```javascipt
const reactor = new Reactor({
  a: true,
  b: "bee",
  c: "cee"
});
observe(() => {
  if (reactor.a) {
    console.log("reactor.b is ", reactor.b);
  } else {
    console.log("reactor.c is ", reactor.c);
  }
}); // prints "reactor.b is bee"

reactor.b = "boop"; // prints "reactor.b is boop"
reactor.c = "cat" // does not trigger the observer

reactor.a = false; // prints "reactor.c is cat"
reactor.b = "blue"; // does not trigger the observer
reactor.c = "cheese"; // prints "reactor.c is cheese"
```

You can stop an observer by just calling "stop()" on the returned observer object. This clears any existing dependencies and prevents triggering. You can restart the observer by just calling "start()". Starting is idempotent so calling "start()" on an already running observer will have no effect.
```javascript
const reactor = new Reactor();
const observer = observe(() => {
  console.log(reactor.foo);
}); // prints "undefined"

reactor.foo = "bar"; // prints "bar"

observer.stop();

reactor.foo = "cheese" // does not trigger the observer

observer.start(); // prints "cheese"
observer.start(); // No effect
observer.start(); // No effect
observer.start(); // No effect

reactor.foo = "moo"; // prints "moo"
```

### Unobserve

Sometimes you might want to read from a Reactor without becoming dependent on it. A common case for this is when using array modification methods. These often also read from the array in order to do the modification.
```javascipt
const reactor = new Reactor({
  ticker: 1
});
const taskList = new Reactor(["a", "b", "c", "d"]);
observe(() => {
  if (reactor.ticker) {
    // Even though we only want to modify the array
    // pop() also reads the length property of the array
    console.log(taskList.pop()); 
  }
}); // prints "d"

reactor.ticker = 2; // prints "c"

// Pushing modifies an arrays length property
// Because we incidentally read the length when calling "pop()" 
// An unwanted dependency was created
taskList.push("e"); // prints "e" 
```

In these cases you can use "unobserve" to shield a block of code from creating dependencies. It takes a function and any reactor properties read inside that function will not be set as dependencies. Unobserve also passes through the return value of its function for syntactic simplicity.
```javascipt
const reactor = new Reactor({
  ticker: 1
});
const taskList = new Reactor(["a", "b", "c", "d"]);
observe(() => {
  if (reactor.ticker) {
    console.log(
      unobserve(() => taskList.pop());
    ); 
  }
}); // prints "d"

reactor.ticker = 2; // prints "c"

taskList.push("e"); // does not trigger the observer
```

### Overrides
If you need to dynamically create observers, you often need to clear manually the old observers. Instead of manually stopping and making a new observer, you can just provide the observer a new execution function. 
```javascipt
const reactor = new Reactor({ foo: "bar" });

// The returned Observer object is itself a function
let observerToBeOverriden = observe(() => {
  console.log(reactor.foo);
}); // prints "bar"

reactor.foo = "moo"; // prints "moo"

// Passing a new function to the observer object replaces the old function
observerToBeOverriden(() => {
  console.log("I am saying", reactor.foo);
}); // prints "I am saying moo"

reactor.foo = "blep"; // prints "I am saying blep"
```

You can also pass a key when creating an observer. When any other observer is created with the same key, it overrides the previous observer instead of creating a new one. 

```javascipt
const reactor = new Reactor({ foo: "bar" });

const firstObserver = observe("fooTracker", () => {
  console.log("first observer: ", reactor.foo);
}); // prints "first observer: bar";
reactor.foo = "moo"; // prints "first observer: moo"

const secondObserver = observe("fooTracker", () => {
  console.log("second observer: ", reactor.foo);
}); // prints "second observer: moo";
reactor.foo = "beep"; // prints "second observer: beep"

firstObserver === secondObserver; // true
```

The key can be any string, but it can also be an object. This can be useful for associating observers with specific UI elements. Key equality has the same semantics as ES6 Map objects.


Installation and use
--------------------

Download [reactor.js](https://github.com/fynyky/reactor.js/raw/master/reactor.js) and include it in your application. 

Reactor has just 2 components: `Signal` and `Observer`
- For browsers, they will be bound to window as global objects for use anywhere.
- For node.js, they will be bound as properties of the exports object to be imported as modules

For [Coffeescript](http://coffeescript.org/) users, you can instead use [reactor.coffee](https://github.com/fynyky/reactor.js/raw/master/reactor.coffee) for your coffeescript workflow.

For [node.js](http://nodejs.org/) users, Reactor.js is also [available on npm](https://npmjs.org/package/reactorjs) by running
```
$ npm install reactorjs
```
And importing it into your application by adding
```javascript
Reactor = require("reactorjs");
Signal = Reactor.Signal;
Observer = Reactor.Observer;
```
For the lucky people using both coffeescript and node.js: you can just use
```coffeescript
{Signal, Observer} = require "reactorjs"
```

Installation and use
--------------------
Tests are stored in `test.coffee` and compiled to `test.js` to be run using Mocha.

To install Mocha just run `npm install`
To run the tests run `npm test`
