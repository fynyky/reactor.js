Reactor.js
==========

Reactor.js is a simple reactive front-end library. It provides 
- `Reactor` objects that store reactive variables
- `Observer` functions that automatically track the reactive variables that they use and retrigger if any of these variables are updated. The function `ob` is shorthand for `new Observer`
- A function `el` that allows declarative element creation in javascript

Here's a quick example of what Reactor does:
```javascript
import { Reactor, ob, el } from 'reactorjs'

const rx = new Reactor({
  name: 'Anakin' 
})

document.body.appendChild(                          
  el('main',   
    el('h1', 'Hello World!'),
    el('h2', (x) => { x.id ='foo' }, () => 'returned text'),
    el('defaults to div', ['this', 'is', 'an', 'array']),
    el('p more class names', ob(() => ('My name is ' + rx.name)))
  )                                                 
)
// <main class="main">
//   <h1 class="h1">Hello World!</h1>
//   <h2 class="h2" id="foo">returned text</h2>
//   <div class="defaults to div">thisisanarray</div>
//   <p class="p more class names">My name is Anakin</p>
// </main>

rx.name = 'Darth'                                   
//   <p class="p more class names">My name is Anakin</p>
// Changes to
//   <p class="p more class names">My name is Darth</p>
```
- `Reactor` objects work like normal objects that you can set and get properties on
- `Observer` functions work like normal functions that you can define and call
- When an `Observer` reads a `Reactor` it registers itself as a dependent
- When a `Reactor` is updated it automatically retriggers the dependent `Observer` functions

- `el` creates a DOM element
- The first argument is the type of element it creates
- Subsequent arguments are appended as children
- Function children are run with the context of the parent element
- Function return values are appended as children
- `Observer` functions automatically replace their child nodes when retriggered

Reactor.js is designed to be unobtrusive and unopinionated. 
- No special syntax to learn. Everything is just plain javascript
- There is no need to manually declare listeners or bindings. Reactor automatically keeps track of all that for you. 
- Use it for the whole front-end or just a few components. Elements created by Reactor are just normal DOM elements, and any variable can be easily replaced with a reactive one without changing the rest of your codebase.

You try it yourself in a JSFiddle [here](https://jsfiddle.net/0voez9qn/)


Installation
------------

Reactor.js is [available on npm](https://npmjs.org/package/reactorjs). Install it by running:
```
$ npm install reactorjs
```

Import it using:
```javascript
import  { 
  el,
  ob,
  attr,
  bind,
  Reactor,
  Observer,
  hide,
  batch,
  shuck
}  from 'reactorjs'
```

It is also available directly from [unpkg](unpkg.com). You can import it in javascript using
```javascript
import { el, attr, bind, ob, Reactor, Observer, hide, batch, shuck } from 'https://unpkg.com/reactorjs'
```




Summary 
-------

```javascript
import { 
  el, attr, bind, ob,
  Reactor, Observer, hide, batch, shuck 
} from 'reactorjs'

// el(description, children...)
el('h1') // Creates a h1 element with a class "h1"

el('notAValidTag') // Creates a div with class "notAValidTag"
                   // Anything not a valid html tag defaults to a div

el('notATag header body h1') // Creates a div with classes "notATag header body h1"
                             // Only the first word is used for tag type
                             // Subsequent words are just added as classes

el('.foo') // Strings starting with '.' or '#' are parsed as query selectors
el('#foo') // They try to find a matching element instead of making a new one

let aDiv = document.createElement('div')
el(aDiv) // Uses the provided element instead of creating a new one


el('h1', 'foo') // Creates <h1 class="h1">foo</h1>
                // Strings provided as children are inserted as text nodes

el('h1', aDiv)  // Creates <h1 class="h1"><div></div></h1>
                // Elements provided as children are just appended

el('h1', function(){this.id = 'foo'}) // Creates <h1 class="h1" id="foo"></h1>
                                      // Functions provided as children are 
                                      // executed in the context of the parent

el('h1', x => { x.id = 'foo' }) // Also creates <h1 class="h1" id="foo"></h1>
                                // The parent is also provided as an argument
                                // This allows arrow functions to work

el('h1', () => "return value") // Creates <h1 class="h1">return value</h1>
                               // Return values are appended as children

let aPromise = new Promise()
el('h1', aPromise) // Creates <h1 class="h1"><!-- promisePlaceholder --></h1>
                   // Places a comment to be replaced when the promise resolves
aPromise.resolve('resolved!') // Becomes <h1 class="h1">resolved!</h1>


// Example of how el works with reactors and observers
// Full explanation of how Observers and Reactors work comes later on
// Attached observers use comments to bookmark their children 
let rx = new Reactor({ foo: 'foo' })
let reactiveEl = el('h1', ob(() => rx.foo)) 
// Creates 
// <h1 class="h1">
  // <!-- observerStart -->
  // foo
  // <!-- observerEnd -->
// </h1>

document.body.appendChild(reactiveEl) // Attached observers sleep when their 
                                      // parent is out of the DOM
                                      // Need to attach it for reactivity

// When updated anything inbetween the bookmarks gets replaces
rx.foo = 'bar'  
// Updates to 
// <h1 class="h1">
  // <!-- observerStart -->
  // bar
  // <!-- observerEnd -->
// </h1>


el('h1', ['foo', 'bar', 'qux']) // Creates <h1 class="h1">foobarqux</h1>
                                // Arrays or any iterable are done recursively
                                
// attr is shorthand for setting attributes
// These 2 are equivalent
el('h1', attr('id', 'foo'))
el('h1', self => self.setAttribute('id', 'foo'))

// bind is shorthand for 2 way binding with a reactor
// These 2 are equivalent
el('h1', bind(rx, 'foo'))
el('h1', self => {
  self.oninput = () => { rx['foo'] = self.value }
  return new Observer(() => { self.value = rx['foo'] })
})

// ob is shorthand for creating Observers
// These 2 are equivalent
ob(function(){})
new Observer(function(){})

// Reactors and Observers
const reactor = new Reactor({ foo: 'bar' })
const observer = new Observer(() => {
  const result = 'reactor.foo is ' + reactor.foo // Sets a dependency on foo
  console.log(result) 
  return result
})
observer() // Prints 'reactor.foo is bar' and starts the observer
reactor.foo = 'baz' // Prints 'reactor.foo is baz'

observer.stop()
reactor.foo = 'qux' // Prints nothing since observer is stopped

observer.start() // Prints 'reactor.foo is baz'
observer.start() // Prints nothing since observer is already started
observer() // Prints 'reactor.foo is baz' even if it is already running

// Observers return values are themselves observable
const trailingObserver = new Observer(() => {
  const result = 'Did you hear: ' + observer.value
  console.log(result)
})
trailingObserver() // Prints 'Did you hear: reactor.foo is baz'
reactor.foo = 'blorp' // Prints 'reactor.foo is blorp' from observer
                      // Also prints 'Did you hear: reactor.foo is blorp' from trailingObserver

// Observers can be given parameters and remember these parameters when triggered
const parameterizedObserver = new Observer((arg1, arg2) => {
  console.log(reactor.foo + arg1 + arg2)
})
parameterizedObserver('beep', 'bop') // Prints bazbeepbop
reactor.foo = 'bla' // Prints blabeepbop

// Observers can also access and remember the last `this` context
const holdingObject = {
  name: 'Mario',
  greet: new Observer(function () { // Need to use traditional functions instead of arrow functions
    console.log("Hello " + reactor.foo + " itsa me " +  this.name)
  })
}
holdingObject.greet() // Prints "Hello bla itsa me Mario"
reactor.foo = 'bonk' // Prints "Hello bonk itsa me Mario"
holdingObject.name = 'Luigi' // Prints nothing since holdingObject is not a Reactor

// hide allows you to avoid particular dependencies in an observer
// This is useful especially when using Array methods that both read and write
reactor.ticker = 1
reactor.names = ["Alice", "Bob", "Charles", "David"]
const partialObserver = new Observer(() => {
  if (reactor.ticker) {
    // hide passes through the return value of its block
    const next = hide(() => reactor.names.pop())
    console.log("next ", next)
  }
})
partialObserver() // prints "next David"
reactor.ticker = 2 // prints "next Charles"
reactor.names.push("Elsie") // Will not trigger the observer

// batch postpones any observer triggers until it is complete
// This allows grouping updates together
const person = new Reactor({
  firstName: 'Clark',
  lastName: 'Kent'
})
new Observer(() => {
  console.log('Look its ' + person.firstName + ' ' + person.lastName)
})() // Prints 'Look its Clark Kent'
batch(() => {
  // None of the following updates will trigger the observer yet
  person.firstName = "Bruce" 
  person.lastName = "Wayne"
}) // prints 'Look its Bruce Wayne'

// shuck removes the Reactor layer and returns the base object
// This is necessary for some native objects which dont work with proxies
const mapReactor = new Reactor(new Map())
Map.prototype.keys.call(mapReactor) // throws an Error
Map.prototype.keys.call(shuck(mapReactor)) // works fine
```


Reactors
--------

A **Reactor** is an object wrapper which automatically tracks observers that read its properties and notifies these observers when those properties are updated.

You create a new Reactor by just calling its constructor.
```javascript
const reactor = new Reactor()
```

You can also wrap an existing object with a Reactor by passing it to the constructor. Changes to the Reactor are passed through to the underlying object.
```javascript
const reactor = new Reactor({
  foo: "bar"
})
```

Reactors behave mostly like plain javascript objects.
```javascript
const reactor = new Reactor({
  foo: "bar"
})
// You can get and set properties as usual
reactor.foo // "bar"
reactor.cow = "moo"
// defineProperty works normally as well
Object.defineProperty(reactor, "milk", {
  get() { return "chocolate" }
})
reactor.milk // "chocolate"
// delete works too
delete reactor.foo
reactor.foo // undefined
```

The key difference of Reactors is that they track when one of their properties is read by an observer and will notify that observer when the property is updated.

```javascript
const reactor = new Reactor({ foo: "bar" })

new Observer(() => {
  console.log("foo is ", reactor.foo)
})() // prints "foo is bar"

reactor.foo = "moo" // prints "foo is moo"

Object.defineProperty(reactor, "foo", {
  get() { return "meow" }
}) // prints "foo is meow"

delete reactor.foo // prints "foo is undefined"
```

Tracking is property specific so observers will not trigger if a different property is updated
```javascript
const reactor = new Reactor({
  foo: "bar",
  moo: "mar"
})

new Observer(() => {
  console.log("foo tracker is now", reactor.foo)
})() // prints "foo tracker is now bar"

new Observer(() => {
  console.log("moo tracker is now", reactor.moo)
})() // prints "moo tracker is now mar"

reactor.foo = "bar2" // prints "foo tracker is now bar2"
reactor.moo = "mar2" // prints "moo tracker is now mar2"
reactor.goo = "goop" // does not trigger any observers
```

If reading a Reactor's property also returns an object, that object is recursively also wrapped in a Reactor before being returned. This allows observers to tracks dependencies in nested objects easily.
```javascript
const reactor = new Reactor({
  outer: {
    inner: "cake"
  }
})

new Observer(() => {
  console.log("inner value is ", reactor.outer.inner)
})() // prints "inner value is cake"
```

Reactors are implemented using [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) objects. This means reactors created from scratch typecheck as Reactors, but Reactors created from an existing object typecheck as the original object.

```javascript
const baseReactor = new Reactor()
baseReactor instanceof Reactor // true
const mapReactor = new Reactor(new Map())
mapReactor instanceof Reactor // false
mapReactor instanceof Map // true
```

This also has implications for native objects or objects which use private properties. Since proxies can't access native or private properties, some methods will fail. To get around this, we provide the `shuck` function which returns a reactor's internal object.

```javascript
// Native object example
const mapReactor = new Reactor(new Map())
Map.prototype.keys.apply(mapReactor) // throws an error
Map.prototype.keys.apply(shuck(mapReactor)) // works fine
```

Observers
---------

An **Observer** is like a normal function that you can define and call. When an Observer reads from a Reactor it automatically tracks that dependency, and when that Reactor property is updated is automatically triggers the observer again.

Observers are created by passing a function to its constructor.
```javascript
const observer = new Observer(() => {
  console.log("hello world")
})
observer() // prints "hello world" and starts the observer
```

For brevity observers can also be created and instantly executed like this
```javascript
new Observer(() => {
  console.log("hello world")
})() // prints "hello world" and starts the observer
```

When an Observer reads a Reactor's property it gets saved as a dependent. When that property is updated it notifies the observer which re-executes its function. This happens automatically without any need to manually declare dependencies.
```javascript
const reactor = new Reactor()
new Observer(() => {
  console.log("reactor.foo is ", reactor.foo)
})() // prints "reactor.foo is undefined"

reactor.foo = "bar" // prints "reactor.foo is bar"
```

An Observer's dependencies are dynamically determined. Only the dependencies actually read in the last execution of an observer can trigger it again. This means that Reactor reads that are only conditionally used will not trigger the observer unnecessarily.
```javascript
const reactor = new Reactor({
  a: true,
  b: "bee",
  c: "cee"
})
new Observer(() => {
  if (reactor.a) {
    console.log("reactor.b is ", reactor.b)
  } else {
    console.log("reactor.c is ", reactor.c)
  }
})() // prints "reactor.b is bee"

reactor.b = "boop" // prints "reactor.b is boop"
reactor.c = "cat" // does not trigger the observer

reactor.a = false // prints "reactor.c is cat"
reactor.b = "blue" // does not trigger the observer
reactor.c = "cheese" // prints "reactor.c is cheese"
```

An Observer's results are themselves observable via either the `value` property, or by triggering the observer via `observer()` and using the return value. This allows you to chain observers together.
```javascript
const reactor = new Reactor({ foo: 'bar' })
const capitalizer = new Observer(() => {
  return reactor.foo.toUpperCase()
})()
const printer = new Observer(() => {
  console.log(capitalizer.value)
})() // prints 'BAR'
reactor.foo = 'baz' // Prints 'BAZ'
```

This works too:
```javascript
const reactor = new Reactor({ foo: 'bar' })
const capitalizer = new Observer(() => {
  return reactor.foo.toUpperCase()
}) // Did not start the observer here
const printer = new Observer(() => {
  // Manually calls capitalizer like a function which actives it
  // As well as accesses its return value as a dependency
  console.log(capitalizer()) 
})() // Starts printer which starts capitalizer
reactor.foo = 'baz' // Prints 'BAZ'
```

You can stop an observer by just calling "stop()" on the returned observer object. This clears any existing dependencies and prevents triggering. You can restart the observer by just calling "start()". Starting is idempotent so calling "start()" on an already running observer will have no effect.
```javascript
const reactor = new Reactor()
const observer = new Observer(() => {
  console.log(reactor.foo)
})() // prints "undefined"

reactor.foo = "bar" // prints "bar"

observer.stop()

reactor.foo = "cheese" // does not trigger the observer

observer.start() // prints "cheese"
observer.start() // No effect
observer.start() // No effect
observer.start() // No effect

reactor.foo = "moo" // prints "moo"
```

For convenience, you can call an observer to execute like a normal function. This works regardless of whether an observer is stopped. Doing so starts the observer up again.

```javascript
const reactor = new Reactor({ foo: "hello" })
const observer = new Observer(() => {
  console.log(reactor.foo)
})() // prints "hello"
reactor.foo = "hi" // prints "hi"
observer() // prints "hi" again

observer.stop()
reactor.foo = "hola" // does not trigger the observer since its stopped
observer() // prints "hola"
```

Like normal functions, observers can expect and be called with arguments. They remember the arguments from the last time they were called and reuse them when automatically triggered.

```javascript
const parameterizedObserver = new Observer((arg1, arg2) => {
  console.log(reactor.foo + arg1 + arg2)
})
parameterizedObserver('beep', 'bop') // Prints bazbeepbop
reactor.foo = 'bla' // Prints blabeepbop
```

Observers can also use and remember the last `this` context. Note that just like normal functions, for the `this` context to be bound to the holding object, it needs to be defined with the traditional `function` keyboard instead of es6 arrow functions. 
```javascript
const holdingObject = {
  name: 'Mario',
  greet: new Observer(function () { // Need to use of `function`
    console.log("Hello " + reactor.foo + " itsa me " +  this.name)
  })
}
holdingObject.greet() // Prints "Hello bla itsa me Mario"
reactor.foo = 'bonk' // Prints "Hello bonk itsa me Mario"
holdingObject.name = 'Luigi' // Prints nothing since holdingObject is not a Reactor
```


### Hide

Sometimes you might want to read from a Reactor without becoming dependent on it. A common case for this is when using array modification methods. These often also read from the array in order to do the modification.
```javascript
const taskList = new Reactor(["a", "b", "c", "d"])

// Creating the following observer will throw a LoopError
// Because it both reads from and modifies the length property of taskList
// As a result it triggers itself in the middle of execution
// This loop is detected and creates an exception
new Observer(() => {
  // Even though we only want to modify the array
  // pop() also reads the length property of the array
  console.log(taskList.pop()) 
})()
```

In these cases you can use "hide" to shield a block of code from creating dependencies. It takes a function and any reactor properties read inside that function will not be set as dependencies. `hide` also passes through the return value of its function for syntactic simplicity.
```javascript
const taskList = new Reactor(["a", "b", "c", "d"])

new Observer(() => {

  console.log(
    // Because we wrap pop() call in an hide block
    // It is not create a depndency on the length property
    // Unlike our previous example
    hide(() => taskList.pop())
  ) 

})() // prints "d"

taskList.push("e") // does not trigger the observer
```

Note that only the reads inside the hide block are shielded from creating dependencies. The rest of the observe block still creates dependencies as normal.

### Overrides
If you need to access the raw function the observer is wrapping you do so with the `execute` property.

```javascript
const myFunction = () => {}
const observer = new Observer(myFunction)
myFunction === observer.execute // true
```

By setting this property you can change an observers internal logic. Doing so clears dependencies and retriggers the observer. Note that the previous `this` and arguments contexts will stay. 

```javascript
const reactor = new Reactor({ foo: "bar" })
let observerToBeOverriden = new Observer((arg) => {
  console.log(reactor.foo, 'and', arg)
})
observerToBeOverriden('blap') // prints "bar and blap"
reactor.foo = "moo" // prints "moo and blap"

// Setting the execute property replaces the old function
observerToBeOverriden.execute = (arg) => {
  console.log("I am saying", arg, reactor.foo)
} // prints "I am saying blap moo"
reactor.foo = "blep" // prints "I am saying blap blep"
```

### Batching
One problem with automatic watchers is that you might end up with multiple repeated triggering when you're updating a whole lot of information all at once. The following code shows an example where you want to update multiple properties, but each property update prematurely triggers the observer since you are not done updating yet.

```javascript
const person = new Reactor({ 
  firstName: "Anakin",
  lastName: "Skywalker",
  faction: "Jedi",
  rank: "Knight"
})

// This observer tracks multiple properties 
// and so will be triggered when any of the properties get updated
const observer = new Observer(() => {
  console.log(
    "I am " +
    person.firstName + 
    " " + 
    person.lastName + 
    ", " + 
    person.faction + 
    " " + 
    person.rank
  )
})() // prints "I am Anakin Skywalker, Jedi Knight"

// The following updates will each trigger the observer even though we only 
// want to trigger the observer once all the updates are complete
person.firstName = "Darth" // prints "I am Darth Skywalker, Jedi Knight"
person.lastName = "Vader" // prints "I am Darth Vader, Jedi Knight"
person.faction = "Sith" // prints "I am Darth Vader, Sith Knight"
person.rank = "Lord" // prints "I am Darth Vader, Sith Lord"
```

Reactor provides the `batch` keyword, which allows you to batch multiple updates together and only trigger the appropriate observers once at the end of the batch block. So the last part of the previous example can be turned into:
```javascript
// batch postpones any observer triggers that originate from inside it
// Triggers are deduplicated so any observer is triggered at most once
batch(() => {
  // None of the following updates will trigger the observer yet
  person.firstName = "Darth" 
  person.lastName = "Vader"
  person.faction = "Sith"
  person.rank = "Lord"
}) // prints "I am Darth Vader, Sith Lord"
```

This is useful when you are making multiple data updates and want to avoid showing an "incomplete" view of the data to observers.

Note that only the observer triggering is postponed till the end. The actual reactor propertes are updated in place as expected. This means that you can have other logic with read-what-you-write semantics within the observer block working just fine.

Development & Testing
---------------------
Tests are stored in `test.js` to be run using Mocha.

Run `npm install` to install the the dev dependencies.

To run the tests run `npm test`.


Comparison to Other Libraries
-----------------------------

Reactor is based on the same reactive principles as [Bacon.js](https://github.com/raimohanska/bacon.js) and [Knockout.js](http://knockoutjs.com/). The main difference is that Reactor is trying to be lightweight and keep the additional syntax and complexity to a minimum. Reactor sets dependencies for you automatically so there is no need to manually set subscriptions/listeners.
