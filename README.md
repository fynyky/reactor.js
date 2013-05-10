Reactor.js
==========

Reactor is a super lightweight library for reactive programming. It makes it trivial to update your model and keep your UI in sync. Reactor automatically creates and maintains dependencies between values, removing the need for manually declaring listeners and bindings. 

Reactor is designed to be unopionated and unobtrusive. It consists of just 2 components: `Signal` and `Observer`. Unlike many frameworks, it imposes no particular structure on your code. There is no need to learn a special syntax or use special classes, objects, or methods.

Overview
--------

Reactor provides signals and observers. 

- Signals are values which may depend on other signals.
- Observers are functions which are triggered on signal changes.

Whenever a signal is updated it automatically updates all its dependent signals & observers as well. 

Here is an example of a basic application using Reactor


    title = Signal("Manager");
    fullTitle = Signal(function(){
      return "Mr " + title();
    })''
    Observer(function(){
      alert "Welcome " + fullTitle() + "!"
    });


Signals
-------

Signal are just values which other signals can depend on. 

Reactor provides a global function called `Signal`. It wraps a given value and returns it as a signal object.

    foo = Signal(7);  

Signal objects are implemented as functions. To read the value of a signal, call it without any arguments.

    foo(); // returns 7

To change the value of a signal, just pass it the new value as an argument

    foo(9); // sets the signal's value to 9

Signals can take on any value: numbers, strings, booleans, and even objects 

    foo(2.39232);
    foo("cheese cakes");
    foo(["x", "y", "z"]);
    foo({"moo": bar});

However, if a signal is given a function, it takes the output of the function as its value instead of the function itself.

    foo = Signal(function(){
      return 2 * 3;
    });

    foo(); // returns 6 instead of the function

Signals can have their value depend on other signals by using these functions.
If a different signal is read from within the given function, then that signal will automatically be set as a dependency. This means that when the dependency has been updated, the value of the dependent signal will be updated as well.

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

Notice that there is no need to declare any listeners or bindings. Reactor automatically finds these dependencies in a signal's function definition.

This automatic updating allows signals to be linked together to form more complex dependency graphs. 

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

Signals should not have any external effects in their definition. In a complex graph, a changed valued might cascade and cause a some dependent signals' definitions to be invoked multiple times before propagation is complete. 

In the example above, updating `firstName` first causes both `fullName` and `barbarianName` to update. However, this causes `comicTitle` to be updated twice. Once when `fullName` is updated, and again when `barbarianName` is updated.

For external effects, it is recommended that observers are used instead.

Observers
---------

Observers are used to invoke external effects when signals are updated. They are almost identical to signals except for 3 main differences

- They are triggered only after all signals have been updated
- They are only triggered once per signal update
- Unlike signals, Observers cannot be depended on

Observers are created in the same way as signals

    foo = Signal("random string");
    bar = Observer(function(){ // alerts "random string" on creation
      alert(foo());
    });

Just like signals, their dependencies are automatically calculated and triggered when the appropriate signal is updated.

    foo("a new random string"); // triggers bar which
                                // alerts "a new random string"

Just like signals, their functions can be updated

    // change bar to log instead of alert
    // triggers once immediately after updating
    bar(function(){
      console.log(foo());
    });

    foo("this string will be logged now"); // triggers bar which now
                                           // logs the string instead

To disable an observer, just pass in a null value

    bar(null); // disables the observer 

Working with Arrays and Objects
-------------------------------

If a signal has an array as its value, directly updating the array will *not* update the signals dependants. Because the signal object is still representing the same array, it does not detect the change. This applies to objects as well

    # foo initialized as a signal with an array as its value
    foo = Signal(["a", "b", "c"]); 

    # bar initialized as a signal whos value depends on foo
    bar = Signal(function(){
      return foo().join("-");
    });

    foo(); // ["a","b","c"]
    bar(); // "a-b-c"

    # Updating foo's array directly does not trigger an update of bar
    foo().push("d");
    foo(); // ["a","b","c","d"]
    bar(); // "a-b-c"

A simple solution is to manually trigger the refresh by setting the signals function to itself.

    # Writing to foo with its already existing value triggers the refresh
    foo(foo());
    foo(); // ["a","b","c","d"]
    bar(); // "a-b-c-d"

In order to make it easier to work with arrays and object. If a signal is representing an object it gains a convenience method for setting its properties
    
    foo.set(key, value); // equivalent to
                         // foo()[key] = value;
                         // foo(foo());

Additionally, if a signal is representing an array it gains a number of convenience methods duplicating standard array mutator methods. 


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