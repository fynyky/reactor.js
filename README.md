Reactor.js
==========

Reactor is a lightweight library for [reactive programming](http://en.wikipedia.org/wiki/Reactive_programming). It provides reactive variables which automatically update themselves when the things they depend on change.

Here's a quick example of what Reactor does:

```javascript
foo = Signal(1);
bar = Signal(function(){
  return foo() + 1;
});

foo(); // 1
bar(); // 2

foo(6);

foo(); // 6
bar(); // 7
```

You declare how a variable should be calculated once, and it automatically recalculates itself when necessary. This makes it easy to keep a complex data model consistent, and a user interface up to date when a model is changed.

Reactor is designed to be unobtrusive and unopinionated. 

- There is no need to manually declare listeners or bindings. Reactor automatically keeps track of all that for you. 
- It imposes no particular structure on your code. Any variable can be easily replaced with a reactive one. 
- There is no need to learn special special syntax or use special classes, objects, or methods.

Overview
--------

Reactor has just 2 components: **signals** and **observers**

- **Signals** are values that are expected to change over time. Signals can depend on each other.
- **Observers** are functions which are triggered on signal changes.

Whenever a signal is updated it automatically updates all its dependent signals & observers as well. Together, signals and observers form a graph representing the propagation of data throughout the application. Signals sit on the inside of the graph representing the internal data model, while observers are on the edges of the graph affecting external systems.

As an example: Signals could be used to represent user data in a web application while observers are used to update the html.


Signals
-------

Signal are just values which other signals can depend on. 

Reactor provides a global function called `Signal`. It wraps a given value and returns it as a signal object.

```javascript
foo = Signal(7);  
```

Signal objects are implemented as functions. To read the value of a signal, call it without any arguments.

```javascript
foo(); // returns 7
```

To change the value of a signal, pass it the new value as an argument.

```javascript
foo(9); // sets the signal's value to 9
```

Signals can take on any value: numbers, strings, booleans, and even arrays and objects.

```javascript
foo(2.39232);
foo("cheese cakes");
foo(true);
foo(["x", "y", "z"]);
foo({"moo": bar});
```

However, if a signal is given a function, it takes the return value of the function as its value instead of the function itself.

```javascript
foo = Signal(function(){
  return 2 * 3;
});

foo(); // returns 6 instead of the function
```

Signals can have their value depend on other signals by using functions. If a different signal is read from within the given function, then that signal will automatically be set as a dependency. This means that when the dependency has been updated, the value of the dependent signal will be updated as well.

```javascript
foo = Signal(7);
bar = Signal(function(){ 
  return foo() * foo(); // since foo is read here, 
                        // is is registered as a dependency of bar
});

foo(); // returns 7 as expected
bar(); // returns 49 since it is defined as foo() * foo()

foo(10); // this updates the value of foo
         // and the value of bar as well

bar(); // returns 100 since it was automatically updated together with foo
```

Notice that there is no need to declare any listeners or bindings. Reactor automatically finds these dependencies in a signal's function definition.

This automatic updating allows signals to be linked together to form more complex dependency graphs. 

```javascript
firstName = Signal("Gob");
lastName = Signal("Bluth");

// fullName depends on both firstName and lastName
fullName = Signal(function(){  
  return firstName() + " " + lastName();
});

// barbarianName depends only on firstName
barbarianName = Signal(function(){
  return firstName() + " the Chicken"
});

// comicTitle depends on barbrianName and fullName and therefore
// indirectly depending on firstName and lastName
comicTitle = Signal(function(){
  return "He who was once " + fullName() + " is now " + barbarianName();
});

firstName(); // "Gob"
lastName(); // "Bluth"
fullName(); // "Gob Bluth"
barbarianName(); // "Gob the Chicken"
comicTitle(); // "He who was once Gob Bluth is now Gob the Chicken"

firstName("Michael"); // updating firstname automatically updates 
                      // fullName, barbarianName, and comicTitle

firstName(); // "Michael"
lastName(); // "Bluth"
fullName(); // "Michael Bluth"
barbarianName(); // "Michael the Chicken"
comicTitle(); // "He who was once Michael Bluth is now Michael the Chicken"
```

Signals should not have any external effects in their definition. In a complex graph, a changed valued might cascade and cause some dependent signals' definitions to be invoked multiple times before propagation is complete. 

In the example above, updating `firstName` first causes both `fullName` and `barbarianName` to update. However, this causes `comicTitle` to be updated twice. Once when `fullName` is updated, and again when `barbarianName` is updated.

For external effects, it is recommended that observers are used instead.

Observers
---------

Observers are almost identical to signals except for 3 main differences:

- They are triggered only after all signals have been updated
- They are only triggered once per signal update
- Unlike signals, observers cannot be depended upon

Observers are used for external effects while signals are used for internal state. Signal functions might trigger multiple times before all signals have finished updating. If signals are used for external effects, they could triggered incorrectly and redundantly. Observers are triggered last and only once per update and therefore do not have this problem.

Observers are created in the same way as signals.

```javascript
foo = Signal("random string");
bar = Observer(function(){ // alerts "random string" on creation
  alert(foo());
});
```

Just like signals, their dependencies are automatically calculated and triggered when the appropriate signal is updated.

```javascript
foo("a new random string"); // triggers bar which
                            // alerts "a new random string"
```

Just like signals, their functions can be updated.

```javascript
// change bar update the html instead of alerting
// triggers once immediately after updating
bar(function(){
  fooElement = document.getElementById("foo");
  fooElement.textContent = foo();
});

foo("this string will be logged now"); // triggers bar which now
                                       // logs the string instead
```

To disable an observer, pass in a null value.

```javascript
bar(null); // disables the observer 
```

Working with Arrays and Objects
-------------------------------

When updating Arrays and Objects, you should use Reactor's convenience methods instead of updating the objects directly. This means you should use:
- `foo.set(key, value)` instead of `foo()[key] = value`
- `foo.pop()` instead of `foo().pop()`
- `foo.push(value)` instead of `foo().push(value)`
- `foo.reverse()` instead of `foo().reverse()`
- `foo.shift()` instead of `foo().shift()`
- `foo.unshift(value)` instead of `foo().unshift(value)`
- `foo.sort(comparison)` instead of `foo().sort(comparison)`
- `foo.splice(start, length)` instead of `foo().splice(start, length)`

The reason for this is if a signal has an array as its value, directly updating the array will **not** update the signal's dependants. Because the signal object is still representing the same array, it does not detect the change. Instead, using the provided convenience methods does the same update but allows the change to be detected. This applies to objects as well.


```javascript
// foo initialized as a signal with an array as its value
foo = Signal(["a", "b", "c"]); 

// bar initialized as a signal whos value depends on foo
bar = Signal(function(){ 
  return foo().join("-");
});

foo(); // ["a","b","c"]
bar(); // "a-b-c"

// Updating foo's array directly does not trigger an update of bar
foo().push("d");
foo(); // ["a","b","c","d"]
bar(); // "a-b-c"

// Instead, updating using the convenience method does trigger the update of bar
foo.push("e");
foo(); // ["a","b","c","d","e"]
bar(); // "a-b-c-d-e"
```

Summary
-------

```javascript
stringSignal = Signal("a string");    // Signals can be set to any value
booleanSignal = Signal(true);
numberSignal = Signal(1);

dependentSignal = Signal(function(){  // If given a function, the signal's value is the return value
                                      // of the function instead of the function itself
  return numberSignal() + 1;          // Reading from another signal automatically sets it
                                      // as a dependency
});                     

stringSignal("a new string value");   // To update a signal just pass it a new value
                                      // this automatically updates all its depenents as well

arraySignal = Signal([                // Signals can even be arrays or objects
  stringSignal,                       // which contain other signals
  booleanSignal,
  numberSignal
]);

alertObserver = Observer(function(){  // Observers are just like signals except:
  alert(arraySignal().join(","));     // They are updated last
});                                   // They are only updated once per propagation
                                      // They cannot be depended on by signals

arraySignal.set(4, "a new value!")    // Convenience method for setting properties on an object Signal

arraySignal.push("foo");              // Convenience methods for updating an array Signal
arraySignal.pop();
arraySignal.unshift("bar");
arraySignal.shift();
arraySignal.reverse();
arraySignal.sort();
arraySignal.splice(1, 2, "not a signal");
```
And if you like [Coffeescript](http://coffeescript.org/), Reactor gets even simpler!

```coffeescript

stringSignal = Signal "a string"                # Signals can be set to any value
booleanSignal = Signal true
numberSignal = Signal 1

dependentSignal = Signal -> numberSignal() + 1  # If given a function, the signal's value is the output
                                                # of the function instead of the function itself
                                                # Reading from another signal automatically 
                                                # sets it as a dependency

stringSignal "a new string value"               # To update a signal just pass it a new value
                                                # this automatically updates all its depenents as well

arraySignal = Signal [                          # Signals can even be arrays or objects
  stringSignal                                  # which contain other signals
  booleanSignal
  numberSignal
]

alertObserver = Observer ->                     # Observers are just like signals except:
  alert arraySignal().join(",")                 # They are updated last
                                                # They are only updated once per propagation
                                                # They cannot be depended on by signals
                                                
arraySignal.set 4, "a new value!"               # Convenience method for setting properties 
                                                # on an object Signal

arraySignal.push "foo"                          # Convenience methods for updating an array Signal      
arraySignal.pop()
arraySignal.unshift("bar")
arraySignal.shift()
arraySignal.reverse()
arraySignal.sort()
arraySignal.splice 1, 2, "not a signal"
```
Installation and use
--------------------

Download [reactor.js](https://github.com/fynyky/reactor.js/raw/master/reactor.js) and include it in your application. 

Reactor has just 2 components: `Signal` and `Observer`
- For browsers, they will be bound to window as global objects for use anywhere.
- For node.js, they will be bound as properties of the exports object to be imported as modules

For [Coffeescript](http://coffeescript.org/) users, you can instead use [reactor.coffee](https://github.com/fynyky/reactor.js/raw/master/reactor.coffee) for your coffeescript workflow.
