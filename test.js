const assert = require("assert");
const { 
  define, 
  Signal, 
  Reactor, 
  Reactors,
  Observer
} = require("./reactor");

describe("Signal", () => {

  it("initializes without error", () => {
    new Signal(true);
    new Signal(false);
    new Signal(null);
    new Signal(undefined);
    new Signal(1);
    new Signal(0);
    new Signal("a");
    new Signal("");
    new Signal(Symbol());
    new Signal({});
    new Signal([]);
    new Signal(() => {});
  });

  it("reads back initialized primitives without error", () => {
    assert.equal(new Signal(true)(), true)
    assert.equal(new Signal(false)(), false)
    assert.equal(new Signal(null)(), null)
    assert.equal(new Signal(undefined)(), undefined)
    assert.equal(new Signal(1)(), 1)
    assert.equal(new Signal(0)(), 0)
    assert.equal(new Signal("a")(), "a")
    assert.equal(new Signal("")(), "")
    const symbol = Symbol();
    assert.equal(new Signal(symbol)(), symbol)
  });

  it.skip("reads back initialized objects as Reactors", () => {
    const objectSignal = new Signal({});
    assert(Reactors.has(objectSignal()));
    const arraySignal = new Signal([]);
    assert(Reactors.has(arraySignal()));
    const functionSignal = new Signal(() => {});
    assert(Reactors.has(functionSignal()));
  });

  it("writes without error", () => {
    const signal = new Signal();
    signal(true);
    signal(false);
    signal(null);
    signal(undefined);
    signal(1);
    signal(0);
    signal("a");
    signal("");
    signal(Symbol());
    signal({});
    signal([]);
    signal(() => {});
  });

  it("returns written values on write", () => {
    const signal = new Signal();
    assert.equal(signal(true), true);
    assert.equal(signal(false), false);
    assert.equal(signal(null), null);
    assert.equal(signal(undefined), undefined);
    assert.equal(signal(1), 1);
    assert.equal(signal(0), 0);
    assert.equal(signal("a"), "a");
    assert.equal(signal(""), "");
    const symbol = Symbol();
    assert.equal(signal(symbol), symbol);
    const object = {};
    assert.equal(signal(object), object);
    const array = [];
    assert.equal(signal(array), array);
    const func = () => {};
    assert.equal(signal(func), func);
  });  

});

describe("Reactor", () => {

  it("initializes without error", () => new Reactor());
  
  it("initializes exsting object without error", () => new Reactor({}));
  
  it("fails to initialize with non-object", () => { 
    assert.throws(() => new Reactor(true), {
      name: "TypeError",
      message: "Cannot create proxy with a non-object as target or handler"
    });
    assert.throws(() => new Reactor(false), {
      name: "TypeError",
      message: "Cannot create proxy with a non-object as target or handler"
    });
    assert.throws(() => new Reactor(null), {
      name: "TypeError",
      message: "Cannot create proxy with a non-object as target or handler"
    });
    assert.throws(() => new Reactor(undefined), {
      name: "TypeError",
      message: "Cannot create proxy with a non-object as target or handler"
    });
    assert.throws(() => new Reactor(1), {
      name: "TypeError",
      message: "Cannot create proxy with a non-object as target or handler"
    });
    assert.throws(() => new Reactor(0), {
      name: "TypeError",
      message: "Cannot create proxy with a non-object as target or handler"
    });
    assert.throws(() => new Reactor("a"), {
      name: "TypeError",
      message: "Cannot create proxy with a non-object as target or handler"
    });
    assert.throws(() => new Reactor(""), {
      name: "TypeError",
      message: "Cannot create proxy with a non-object as target or handler"
    });
    assert.throws(() => new Reactor(Symbol()), {
      name: "TypeError",
      message: "Cannot create proxy with a non-object as target or handler"
    });
  });

  it("writes without error", () => {
    const reactor = new Reactor();
    reactor.foo = "bar";
  });

  it("reads without error", () => {
    const reactor = new Reactor();
    reactor.foo = "bar";
    assert.equal(reactor.foo, "bar");
  });

  it("reads from existing object without error", () => {
    const reactor = new Reactor({
      foo: "bar"
    });
    assert.equal(reactor.foo, "bar");
  });

  it("can defineProperty without error", () => {
    const reactor = new Reactor();
    Object.defineProperty(reactor, "foo", {
      get() { return "bar"; }
    });
    assert.equal(reactor.foo, "bar");
  });

  it("silently fails write after defineProperty non-writable", () => {
    const reactor = new Reactor();
    Object.defineProperty(reactor, "foo", {
      value: "bar",
      writable: false
    });
    reactor.foo = "baz";
    assert.equal(reactor.foo, "bar");
  });

  it("fails write after defineProperty non-writable if 'use strict'", () => {
    "use strict";
    const reactor = new Reactor();
    Object.defineProperty(reactor, "foo", {
      value: "bar",
      writable: false
    });
    assert.throws(() => (reactor.foo = "baz"), {
      name: "TypeError"
    });
  });
  
  it("can deleteProperty without error", () => {
    const reactor = new Reactor({
      foo: "bar"
    });
    delete reactor.foo;
    assert.equal(reactor.foo, undefined);
  });

});

describe("Definition", () => {

  it("initializes function without error", () => define(() => {}));

  it("fails to initialize with no argument", () => {
    assert.throws((() => define()), {
      name: "TypeError",
      message: "Cannot create definition with a non-function"
    })
  });

  it("fails to initialize with non-function", () => {
    assert.throws((() => define(true)), {
      name: "TypeError",
      message: "Cannot create definition with a non-function"
    })
    assert.throws((() => define(false)), {
      name: "TypeError",
      message: "Cannot create definition with a non-function"
    })
    assert.throws((() => define(null)), {
      name: "TypeError",
      message: "Cannot create definition with a non-function"
    })
    assert.throws((() => define(undefined)), {
      name: "TypeError",
      message: "Cannot create definition with a non-function"
    })
    assert.throws((() => define(1)), {
      name: "TypeError",
      message: "Cannot create definition with a non-function"
    })
    assert.throws((() => define(0)), {
      name: "TypeError",
      message: "Cannot create definition with a non-function"
    })
    assert.throws((() => define("a")), {
      name: "TypeError",
      message: "Cannot create definition with a non-function"
    })
    assert.throws((() => define("")), {
      name: "TypeError",
      message: "Cannot create definition with a non-function"
    })
    assert.throws((() => define(Symbol())), {
      name: "TypeError",
      message: "Cannot create definition with a non-function"
    })
    assert.throws((() => define({})), {
      name: "TypeError",
      message: "Cannot create definition with a non-function"
    })
    assert.throws((() => define([])), {
      name: "TypeError",
      message: "Cannot create definition with a non-function"
    })
  });

  describe("Signal", () => {

    it("initializes definition without error", () => {
      new Signal(define(() => {}));
    })

    it("reads definition without error", () => {
      new Signal(define(() => {}))();
    })

    it("reads definition return value", () => {
      const signal = new Signal(define(() => 2))
      assert.equal(signal(), 2);
    })

  });

  describe("Reactor", () => {

    it("sets definition without error", () => {
      const reactor = new Reactor();
      reactor.foo = define(() => "bar");
    })

    it("gets definition return value", () => {
      const reactor = new Reactor();
      reactor.foo = define(() => "bar");
      assert.equal(reactor.foo, "bar");
    })

    it("can override definition", () => {
      const reactor = new Reactor();
      reactor.foo = define(() => "bar");
      assert.equal(reactor.foo, "bar");
      reactor.foo = 2;
      assert.equal(reactor.foo, 2);
    })

    it("can set definition as non-writable", () => {
      const reactor = new Reactor();
      Object.defineProperty(reactor, "foo", {
        value: define(() => "bar"),
        writable: false
      });
      assert.equal(reactor.foo, "bar");
      reactor.foo = 2;
      assert.equal(reactor.foo, "bar");
    })

    it("sets definition as enumerable by default", () => {
      const reactor = new Reactor();
      reactor.foo = define(() => "bar");
      assert.equal(Object.keys(reactor).length, 1);
    })

    it("can set definition as non-enumerable", () => {
      const reactor = new Reactor();
      Object.defineProperty(reactor, "foo", {
        value: define(() => "bar"),
        enumerable: false
      });
      assert.equal(Object.keys(reactor).length, 0);
    });

    // Temporarily disabled test since this seems fundamentally impossible
    // due to implementation where you cannot reconfigure the descriptor in a trap
    // if configurable is set to false. 
    // File bug here https://bugs.chromium.org/p/v8/issues/detail?id=7884
    // it("can set definition as non-configurable", () => {
    //   const reactor = new Reactor();
    //   Object.defineProperty(reactor, "foo", {
    //     value: define(() => "bar"),
    //     configurable: false
    //   });
    //   delete reactor.foo;
    //   assert.equal(reactor.foo, "bar")
    // });

  });

});




describe("Observer", () => {

  it("initializes function without error", () => new Observer(() => {}));

  it("fails to initialize with no argument", () => {
    assert.throws((() => new Observer()), {
      name: "TypeError",
      message: "Cannot create observer with a non-function"
    })
  });

  it("fails to initialize with non-function", () => {
    assert.throws((() => new Observer(true)), {
      name: "TypeError",
      message: "Cannot create observer with a non-function"
    });
    assert.throws((() => new Observer(false)), {
      name: "TypeError",
      message: "Cannot create observer with a non-function"
    });
    assert.throws((() => new Observer(null)), {
      name: "TypeError",
      message: "Cannot create observer with a non-function"
    });
    assert.throws((() => new Observer(undefined)), {
      name: "TypeError",
      message: "Cannot create observer with a non-function"
    });
    assert.throws((() => new Observer(1)), {
      name: "TypeError",
      message: "Cannot create observer with a non-function"
    });
    assert.throws((() => new Observer(0)), {
      name: "TypeError",
      message: "Cannot create observer with a non-function"
    });
    assert.throws((() => new Observer("a")), {
      name: "TypeError",
      message: "Cannot create observer with a non-function"
    });
    assert.throws((() => new Observer("")), {
      name: "TypeError",
      message: "Cannot create observer with a non-function"
    });
    assert.throws((() => new Observer(Symbol())), {
      name: "TypeError",
      message: "Cannot create observer with a non-function"
    });
    assert.throws((() => new Observer({})), {
      name: "TypeError",
      message: "Cannot create observer with a non-function"
    });
    assert.throws((() => new Observer([])), {
      name: "TypeError",
      message: "Cannot create observer with a non-function"
    });
  });

  describe("Triggering", () => {

    it("triggers once on initialization", () => {
      let counter = 0;
      const observer = new Observer(() => counter += 1);
      assert.equal(counter, 1);
    });

    it("triggers once on Signal dependency write", () => {
      let counter = 0;
      let tracker;
      const signal = new Signal("foo");
      const observer = new Observer(() => {
        counter += 1;
        tracker = signal();
      });
      assert.equal(counter, 1);
      assert.equal(tracker, "foo");
      signal("bar");
      assert.equal(counter, 2);
      assert.equal(tracker, "bar");
    });


    it("triggers once on Signal dependency defined write", () => {
      let counter = 0;
      let tracker;
      const signal = new Signal("foo");
      const observer = new Observer(() => {
        counter += 1;
        tracker = signal();
      });
      assert.equal(counter, 1);
      assert.equal(tracker, "foo");
      signal(define(() => "bar"));
      assert.equal(counter, 2);
      assert.equal(tracker, "bar");
    });

    it("triggers once on Reactor dependency write", () => {
      let counter = 0;
      let tracker;
      const reactor = new Reactor({
        foo: "bar"
      });
      const observer = new Observer(() => {
        counter += 1;
        tracker = reactor.foo;
      });
      assert.equal(counter, 1);
      assert.equal(tracker, "bar");
      reactor.foo = "mux"
      assert.equal(counter, 2);
      assert.equal(tracker, "mux");
    });

    it("triggers once on Reactor dependency defined write", () => {
      let counter = 0;
      let tracker;
      const reactor = new Reactor();
      const observer = new Observer(() => {
        counter += 1;
        tracker = reactor.foo;
      });
      assert.equal(counter, 1);
      assert.equal(tracker, undefined);
      reactor.foo = define(() => "mux");
      assert.equal(counter, 2);
      assert.equal(tracker, "mux");
    });

    it("triggers once on nested Reactor dependency write", () => {
      let counter = 0;
      let tracker;
      const reactor = new Reactor({
        foo: {
          bar: "baz"
        }
      });
      const observer = new Observer(() => {
        counter += 1;
        tracker = reactor.foo.bar;
      });
      assert.equal(counter, 1);
      assert.equal(tracker, "baz");
      reactor.foo.bar = "moo";
      assert.equal(counter, 2);
      assert.equal(tracker, "moo");
    });

    it("triggers on defineProperty", () => {
      let tracker;
      const reactor = new Reactor({
        foo: "bar"
      });
      const observer = new Observer(() => (tracker = reactor.foo));
      assert.equal(tracker, "bar");
      Object.defineProperty(reactor, "foo", {
        get() { return "baz"; }
      });
      assert.equal(tracker, "baz");
    });

    it("trigger on deleteProperty", () => {
      let tracker;
      const reactor = new Reactor({
        foo: "bar"
      });
      const observer = new Observer(() => (tracker = reactor.foo));
      assert.equal(tracker, "bar");
      delete reactor.foo;
      assert.equal(tracker, undefined);
    });

    it("triggers on array update methods", () => {
      let counter = 0;
      let tracker;
      const reactor = new Reactor([]);
      const observer = new Observer(() => {
        counter += 1;
        tracker = reactor[0];
      });
      assert.equal(counter, 1);
      assert.equal(tracker, undefined);
      reactor.push("foo");
      assert.equal(counter, 2);
      assert.equal(tracker, "foo");
      reactor.unshift("bar");
      assert.equal(counter, 3);
      assert.equal(tracker, "bar");
    });

    it("triggers correctly on nested observer definitions", () => {
      const outerSignal = new Signal("foo");
      const innerSignal = new Signal("bar");
      let outerCounter = 0;
      let innerCounter = 0;
      let outerTracker;
      let innerTracker;
      let outerObserver;
      let innerObserver;
      outerObserver = new Observer(() => {
        outerCounter += 1;
        outerTracker = outerSignal();
        if (innerObserver) innerObserver.stop();
        innerObserver = new Observer(() => {
          innerCounter += 1;
          innerTracker = innerSignal();
        });
      });
      assert.equal(outerCounter, 1);
      assert.equal(outerTracker, "foo");
      assert.equal(innerCounter, 1);
      assert.equal(innerTracker, "bar");
      innerSignal("baz");
      assert.equal(outerCounter, 1);
      assert.equal(outerTracker, "foo");
      assert.equal(innerCounter, 2);
      assert.equal(innerTracker, "baz");
      outerSignal("moo");
      assert.equal(outerCounter, 2);
      assert.equal(outerTracker, "moo");
      assert.equal(innerCounter, 3);
      assert.equal(innerTracker, "baz");
    });

  });

  describe("Start Stop", () => {

    it("can stop observing", () => {
      let counter = 0;
      let tracker;
      const signal = new Signal("foo");
      const observer = new Observer(() => {
        counter += 1;
        tracker = signal()
      });
      assert.equal(counter, 1);
      assert.equal(tracker, "foo");
      signal("bar");
      assert.equal(counter, 2);
      assert.equal(tracker, "bar");
      observer.stop();
      signal("moo");
      assert.equal(counter, 2);
      assert.equal(tracker, "bar");
    });

    it("can start after stopping", () => {
      let counter = 0;
      let tracker = null;
      const signal = new Signal("foo");
      const observer = new Observer(() => {
        counter += 1;
        tracker = signal();
      });
      assert.equal(counter, 1);
      assert.equal(tracker, "foo");
      observer.stop();
      signal("moo");
      assert.equal(counter, 1);
      assert.equal(tracker, "foo");
      observer.start();
      assert.equal(counter, 2);
      assert.equal(tracker, "moo");
    });

    it("has no effect with repeated starts", () => {
      let counter = 0;
      let tracker = null;
      const signal = new Signal("foo");
      const observer = new Observer(() => {
        counter += 1;
        tracker = signal();
      });
      assert.equal(counter, 1);
      assert.equal(tracker, "foo");
      observer.stop();
      signal("moo");
      assert.equal(counter, 1);
      assert.equal(tracker, "foo");
      observer.start();
      assert.equal(counter, 2);
      assert.equal(tracker, "moo");
      observer.start();
      assert.equal(counter, 2);
      assert.equal(tracker, "moo");
    });

  });

  describe("Error Handling", () => {

    it("throws an error on an Observer loop", () => {
      let counter = 0;
      let tracker;
      const signal = new Signal("foo");
      assert.throws(() => {
        const observer = new Observer(() => {
          counter += 1;
          tracker = signal();
          if (counter < 100) signal("bar");
        });
      }, {
        name: "LoopError",
        message: "observer attempted to activate itself while already executing"
      });
      assert.equal(counter, 1);
      assert.equal(tracker, "foo");
    });

    it("throws an error on a Signal write if there is an Observer error", () => {
      const signal = new Signal(1);
      const observer = new Observer(() => {
        if (signal() > 1) throw new Error("dummy error");
      });
      assert.throws(() => signal(2), {
        name: "Error",
        message: "dummy error"
      });
    });

    it("throws a CompoundError if there are multiple Observer errors", () => {
      const signal = new Signal(1);
      const observer1 = new Observer(() => {
        if (signal() > 1) throw new Error("dummy error 1");
      });
      const observer2 = new Observer(() => {
        if (signal() > 1) throw new Error("dummy error 2");
      });
      assert.throws(() => signal(2), {
        name: "CompoundError"
      });
    });

  });

  describe("Misc", () => {

    it("respects receiver context for prototype inheritors", () => {
      const reactor = new Reactor();
      reactor.foo = "bar";
      Object.defineProperty(reactor, "getFoo", {
        get() {
          return this.foo;
        }
      })
      assert.equal(reactor.getFoo, "bar");
      reactor.foo = "quu";
      assert.equal(reactor.getFoo, "quu");
      const inheritor = Object.create(reactor);
      assert.equal(inheritor.foo, "quu");
      assert.equal(inheritor.getFoo, "quu");
      inheritor.foo = "mux"
      assert.equal(inheritor.getFoo, "mux");
    });

  });

});