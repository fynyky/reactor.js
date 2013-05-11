Reactor.js
==========

Reactor is a lightweight library for [reactive programming](http://en.wikipedia.org/wiki/Reactive_programming). It provides reactive variables which automatically update themselves when the things they depend on are changed.

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

- There is no need to manually declare listeners or bindings since Reactor automatically keeps track of all that for you. 
- It imposes no particular structure on your code since any variable can be easily replaced with a reactive one. 
- There is no need to learn special special syntax or use special classes, objects, or methods.

Overview
--------

Reactor has just 2 components: **signals** and **observers**

- **Signals** are values which may depend on other signals.
- **Observers** are functions which are triggered on signal changes.

Whenever a signal is updated it automatically updates all its dependent signals & observers as well. 

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

To change the value of a signal, just pass it the new value as an argument.

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

However, if a signal is given a function, it takes the output of the function as its value instead of the function itself.

```javascript
foo = Signal(function(){
  return 2 * 3;
});

foo(); // returns 6 instead of the function
```

Signals can have their value depend on other signals by using these functions. If a different signal is read from within the given function, then that signal will automatically be set as a dependency. This means that when the dependency has been updated, the value of the dependent signal will be updated as well.

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
- Unlike signals, Observers cannot be depended on

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

To disable an observer, just pass in a null value.

```javascript
bar(null); // disables the observer 
```

Working with Arrays and Objects
-------------------------------

If a signal has an array as its value, directly updating the array will **not** update the signal's dependants. Because the signal object is still representing the same array, it does not detect the change. This applies to objects as well.

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
```

A simple solution is to manually trigger the refresh by setting the signals function to itself.

```javascript
// Writing to foo with its already existing value triggers the refresh
foo(foo());
foo(); // ["a","b","c","d"]
bar(); // "a-b-c-d"
```

If a signal is representing an object it gains a convenience method for setting its properties.

```javascript
foo.set(key, value); // equivalent to
                     // foo()[key] = value;
                     // foo(foo());
```

Additionally, if a signal is representing an array it gains a number of convenience methods duplicating standard array mutator methods.

```javascript
foo.pop(); // Equivalent to 
           // foo().pop(); 
           // foo(foo());

foo.push(); // Equivalent to 
               // foo().push(); 
               // foo(foo());

foo.reverse(); // Equivalent to 
               // foo().reverse();
               // foo(foo());

foo.shift(); // Equivalent to 
             // foo().shift();
             // foo(foo());

foo.unshift(); // Equivalent to 
                  // foo().unshift();
                  // foo(foo());

foo.sort(); // Equivalent to 
            // foo().sort();
            // foo(foo());

foo.splice(); // Equivalent to 
              // foo().splice();
              // foo(foo());
```

Summary
-------

```javascript
stringSignal = Signal("a string");    // Signals can be set to any value
booleanSignal = Signal(true);
numberSignal = Signal(1);

dependentSignal = Signal(function(){  // If given a function, the value is the output of the function
                                      // rather than the function itself

  if (booleanSignal()){               // Reading from another signal automatically sets it
    return "I haz " + stringSignal(); // as a dependency
  } else {
    return numberSignal() * 2;
  }
  
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
