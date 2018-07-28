Note: Reactor.js is now on version 1.0 which is fundamentally incompatible with its previous incarnation. If you need the previous version refer to the 0.1 branch [here](https://github.com/fynyky/reactor.js/tree/0.1)

Reactor.js
==========

Reactor.js is a lightweight library for [reactive programming](http://en.wikipedia.org/wiki/Reactive_programming). It provides observer blocks that automatically track the reactive variables that they use and get retriggered if any of these variables are updated. This makes it easy to keep a complex data model consistent, or a user interface up to date when a model is changed.

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
- There is no need to learn special syntax or a domain specific language. Reactors behave just like normal objects and you can observe any synchronous code.

If you want to see Reactor.js in action, take a look at this [example todo list](https://jsfiddle.net/qr92xem4/)

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
reactor.name = "Bob";
reactor.name; // "Bob"

// Use the "observe" function to create an Observer
// Observers execute immediately upon creation
const observer = observe(() => {
  // Reading from a Reactor property automatically saves it as a dependency
  console.log("reactor.foo is ", reactor.foo);
}); // prints "reactor.foo is bar"

// Dependency tracking works for sub-objects as well
const innerObserver = observe(() => {
  console.log("reactor.outer.inner is ", reactor.outer.inner);
}); // prints "reactor.outer.inner is value"

// Updating the property automatically notifies the observer
reactor.foo = "updated"; // prints "reactor.foo is updated"
reactor.outer.inner = "cheese" // prints "reactor.outer.inner is cheese"

// You can use "unobserve" to avoid particular dependencies in an observer
// This is useful especially when using array methods that both read and write
reactor.ticker = 1;
reactor.names = ["Alice", "Bob", "Charles", "David"];
const partialObserver = observe(() => {
  if (reactor.ticker) {
    // Unobserve passes through the return value of its block
    const next = unobserve(() => reactor.names.pop());
    console.log("next ", next);
  }
}); // prints "next David"

reactor.ticker += 1; // prints "next Charles"
reactor.names.push("Elsie"); // Will not trigger the observer

// You can stop an observer by calling stop()
partialObserver.stop();
reactor.ticker += 1;  // Will not trigger since observer is stopped

// You can restart an observer by calling start()
// This also retriggers the observed block
partialObserver.start(); // prints "next Elsie"

// Start is idempotent so starting an already running observer has no effect
partialObserver.start(); // -
partialObserver.start(); // -
partialObserver.start(); // -

// For convenience, you can call the function provided to the observer
// This works regardless of whether the observer is started or stopped
partialObserver(); // prints "next Bob"

// You can provide a name to conveniently override old observers
// This simplifies dynamic observer creation
reactor.counter = 1
const firstObserver = observe("counterReporter", () => {
  console.log("first observer: ", reactor.counter);
}); // prints "first observer: 1";
reactor.counter += 1 // prints "first observer: 2"

const secondObserver = observe("counterReporter", () => {
  console.log("second observer: ", reactor.counter);
}); // prints "second observer: 2";
reactor.counter += 1; // prints "second observer: 3"
                      // First observer has been overriden and does not trigger
```

Comparison to Other Libraries
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
```javascript
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

For convenience, you can call an observer with no arguments to execute like a normal function. This works regardless of whether an observer is stopped.

```javascript
const reactor = new Reactor({ foo: "hello" });
const observer = observe(() => {
  console.log(reactor.foo);
}); // prints "hello"
reactor.foo = "hi"; // prints "hi"
observer(); // prints "hi" again

observer.stop();
reactor.foo = "hola" // does not trigger the observer since its stopped
observer(); // prints "hola"
```
Note that calling an observer this way does not create any of the observer's dependencies. It is equivalent to just calling the plain function without the observer wrapper. 

### Unobserve

Sometimes you might want to read from a Reactor without becoming dependent on it. A common case for this is when using array modification methods. These often also read from the array in order to do the modification.
```javascript
const taskList = new Reactor(["a", "b", "c", "d"]);

// Creating the following observer will throw a LoopError
// Because it both reads from and modifies the length property of taskList
// As a result it triggers itself in the middle of execution
// This loop is detected and creates an exception
observe(() => {
  // Even though we only want to modify the array
  // pop() also reads the length property of the array
  console.log(taskList.pop()); 
});
```

In these cases you can use "unobserve" to shield a block of code from creating dependencies. It takes a function and any reactor properties read inside that function will not be set as dependencies. Unobserve also passes through the return value of its function for syntactic simplicity.
```javascript
const taskList = new Reactor(["a", "b", "c", "d"]);

observe(() => {

  console.log(
    // Because we wrap pop() call in an unobserve block
    // It is not create a depndency on the length property
    // Unlike our previous example
    unobserve(() => taskList.pop())
  ); 

}); // prints "d"

taskList.push("e"); // does not trigger the observer
```

Note that only the reads inside the unobserve block are shielded from creating dependencies. The rest of the observe block still creates dependencies as normal.

### Overrides
If you need to dynamically create observers, you often need to manually clear the old observers. Instead of manually stopping and making a new observer, you can just provide the existing observer a new execution function. 
```javascript
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

```javascript
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

### Batching
One problem with automatic watchers is that you might end up with multiple repeated triggering when you're updating a whole lot of information all at once. The following code shows an example where you want to update multiple properties, but each property update prematurely triggers the observer since you are not done updating yet.

```javascript
const person = new Reactor({ 
  firstName: "Anakin",
  lastName: "Skywalker",
  faction: "Jedi",
  rank: "Knight"
});

// This observer tracks multiple properties 
// and so will be triggered when any of the properties get updated
const observer = observe(() => {
  console.log(
    "I am " +
    person.firstName + 
    " " + 
    person.lastName + 
    ", " + 
    person.faction + 
    " " + 
    person.rank
  );
}); // prints "I am Anakin Skywalker, Jedi Knight"

// The following updates will each trigger the observer even though we only 
// want to trigger the observer once all the updates are complete
person.firstName = "Darth"; // prints "I am Darth Skywalker, Jedi Knight"
person.lastName = "Vader"; // prints "I am Darth Vader, Jedi Knight"
person.faction = "Sith"; // prints "I am Darth Vader, Sith Knight"
person.rank = "Lord"; // prints "I am Darth Vader, Sith Lord"
```

Reactor provides the `batch` keyword, which allows you to batch multiple updates together and only trigger the appropriate observers once at the end of the batch block. So the last part of the previous example can be turned into:
```javascript
// batch postpones any observer triggers that originate from inside it
// Triggers are deduplicated so any observer is triggered at most once
batch(() => {
  // None of the following updates will trigger the observer yet
  person.firstName = "Darth"; 
  person.lastName = "Vader";
  person.faction = "Sith";
  person.rank = "Lord";
}); // prints "I am Darth Vader, Sith Lord"
```

This is useful when you are making multiple data updates and want to avoid showing an "incomplete" view of the data to observers.

Note that only the observer triggering is postponed till the end. The actual reactor propertes are updated in place as expected. This means that you can have other logic with read-what-you-write semantics within the observer block working just fine.

Installation & Use
--------------------

Reactor.js is [available on npm](https://npmjs.org/package/reactorjs). You can install it by running
```
$ npm install reactorjs
```

Inside you application you can include the necessary components by running
```javascript
const { 
  Reactor, 
  observe,
  unobserve
} = require("reactorjs");
```

If you want to just use Reactor.js directly without using npm, you can download [Reactor.js](https://github.com/fynyky/reactor.js/raw/master/reactor.js) and include it in your application. When used outside of a module system, Reactor provides the same `Reactor`, `observe`, `unobserve`, and `batch` components as global objects.


Development & Testing
---------------------
Tests are stored in `test.js` to be run using Mocha.

Run `npm install` to install the the dev dependencies.

To run the tests run `npm test`.
