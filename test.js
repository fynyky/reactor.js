const assert = require("assert");
const { 
  define, 
  Signal, 
  Reactor, 
  Observer,
  coreExtractor
} = require("./reactor");

describe("Signal", () => {

  it("should initialize without error", () => {
    new Signal(true);
    new Signal(false);
    new Signal(null);
    new Signal(undefined);
    new Signal(1);
    new Signal(0);
    new Signal(-1);
    new Signal("a");
    new Signal(Symbol());
    new Signal({});
    new Signal([]);
    new Signal(() => {});
  });

  it("Should read back initialized primitives without error", () => {
    assert.equal(new Signal(true)(), true)
    assert.equal(new Signal(false)(), false)
    assert.equal(new Signal(null)(), null)
    assert.equal(new Signal(undefined)(), undefined)
    assert.equal(new Signal(1)(), 1)
    assert.equal(new Signal(0)(), 0)
    assert.equal(new Signal(-1)(), -1)
    assert.equal(new Signal("a")(), "a")
    const symbol = Symbol();
    assert.equal(new Signal(symbol)(), symbol)
  });

  it("should read back initialized objects as Reactors", () => {
    const objectSignal = new Signal({});
    assert.notEqual(coreExtractor.get(objectSignal()), undefined);
    const arraySignal = new Signal([]);
    assert.notEqual(coreExtractor.get(arraySignal()), undefined);
    const functionSignal = new Signal(() => {});
    assert.notEqual(coreExtractor.get(functionSignal()), undefined);
  });

  it("should write without error", () => {
    const signal = new Signal();
    signal(true);
    signal(false);
    signal(null);
    signal(undefined);
    signal(1);
    signal(0);
    signal(-1);
    signal("a");
    signal(Symbol());
    signal({});
    signal([]);
    signal(() => {});
  });

  it("should return written values on write", () => {
    const signal = new Signal();
    assert.equal(signal(true), true);
    assert.equal(signal(false), false);
    assert.equal(signal(null), null);
    assert.equal(signal(undefined), undefined);
    assert.equal(signal(1), 1);
    assert.equal(signal(0), 0);
    assert.equal(signal(-1), -1);
    assert.equal(signal("a"), "a");
    const symbol = Symbol();
    assert.equal(signal(symbol), symbol);
    const object = {};
    assert.equal(signal(object), object);
    const array = [];
    assert.equal(signal(array), array);
    const func = Symbol();
    assert.equal(signal(func), func);
  });  

});

describe("Reactor", () => {
  it("should initialize without error", () => new Reactor());
  it("should write without error", () => {
    const reactor = new Reactor();
    reactor.foo = "bar";
  });
  it("should read without error", () => {
    const reactor = new Reactor();
    reactor.foo = "bar";
    assert.equal(reactor.foo, "bar");
  });
  it("should initialize with existing object without error", () => {
    new Reactor({});
  });
  it("should read from existing object without error", () => {
    const reactor = new Reactor({
      foo: "bar"
    });
    assert.equal(reactor.foo, "bar");
  });
  it("should defineProperty without error", () => {
    const reactor = new Reactor();
    Object.defineProperty(reactor, "foo", {
      get() { return "bar"; }
    });
    assert.equal(reactor.foo, "bar");
  });
  it("should silently fail write after defineProperty non-writable", () => {
    const reactor = new Reactor();
    Object.defineProperty(reactor, "foo", {
      value: "bar",
      writable: false
    });
    reactor.foo = "baz";
    assert.equal(reactor.foo, "bar");
  });
  it("should deleteProperty without error", () => {
    const reactor = new Reactor({
      foo: "bar"
    });
    delete reactor.foo;
    assert.equal(reactor.foo, undefined);
  });
});

describe("Definition", () => {
  it("should initialize function without error", () => {
    define(() => {});
  });
  it("should fail to initialize without argument", () => {
    assert.throws((() => define()), {
      name: "TypeError",
      message: "Cannot create definition with a non-function"
    })
  });
  it("should fail to initialize with boolean", () => {
    assert.throws((() => define(true)), {
      name: "TypeError",
      message: "Cannot create definition with a non-function"
    })
  });
  it("should fail to initialize with null", () => {
    assert.throws((() => define(null)), {
      name: "TypeError",
      message: "Cannot create definition with a non-function"
    })
  });
  it("should fail to initialize with undefined", () => {
    assert.throws((() => define(undefined)), {
      name: "TypeError",
      message: "Cannot create definition with a non-function"
    })
  });
  it("should fail to initialize with number", () => {
    assert.throws((() => define(1)), {
      name: "TypeError",
      message: "Cannot create definition with a non-function"
    })
  });
  it("should fail to initialize with string", () => {
    assert.throws((() => define("a")), {
      name: "TypeError",
      message: "Cannot create definition with a non-function"
    })
  });
  it("should fail to initialize with object", () => {
    assert.throws((() => define({})), {
      name: "TypeError",
      message: "Cannot create definition with a non-function"
    })
  });
  it("should fail to initialize with array", () => {
    assert.throws((() => define([])), {
      name: "TypeError",
      message: "Cannot create definition with a non-function"
    })
  });
});

describe("Signal Definition", () => {
  it("should initialize definition without error", () => {
    new Signal(define(() => {}));
  })
  it("should read definition without error", () => {
    new Signal(define(() => {}))();
  })
  it("should read definition return value", () => {
    const signal = new Signal(define(() => 2))
    assert.equal(signal(), 2);
  })
});

describe("Reactor Definition", () => {
  it("should set definition without error", () => {
    const reactor = new Reactor();
    reactor.foo = define(() => "bar");
  })
  it("should get definition return value", () => {
    const reactor = new Reactor();
    reactor.foo = define(() => "bar");
    assert.equal(reactor.foo, "bar");
  })
  it("should be able to overide definition", () => {
    const reactor = new Reactor();
    reactor.foo = define(() => "bar");
    assert.equal(reactor.foo, "bar");
    reactor.foo = 2;
    assert.equal(reactor.foo, 2);
  })
  it("should be able to set definition as non-writable", () => {
    const reactor = new Reactor();
    Object.defineProperty(reactor, "foo", {
      value: define(() => "bar"),
      writable: false
    });
    assert.equal(reactor.foo, "bar");
    reactor.foo = 2;
    assert.equal(reactor.foo, "bar");
  })
  it("should set definition as enumerable by default", () => {
    const reactor = new Reactor();
    reactor.foo = define(() => "bar");
    assert.equal(Object.keys(reactor).length, 1);
  })
  it("should be able to set definition as non-enumerable", () => {
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
  // it("should be able to set definition as non-configurable", () => {
  //   const reactor = new Reactor();
  //   Object.defineProperty(reactor, "foo", {
  //     value: define(() => "bar"),
  //     configurable: false
  //   });
  //   delete reactor.foo;
  //   assert.equal(reactor.foo, "bar")
  // });
});

describe("Observer", () => {
  it("should initialize function without error", () => new Observer(() => {}))
  it("should fail to initialize without argument", () => {
    assert.throws((() => new Observer()), {
      name: "TypeError",
      message: "Cannot create observer with a non-function"
    })
  })
  it("should fail to initialize with boolean", () => {
    assert.throws((() => new Observer(true)), {
      name: "TypeError",
      message: "Cannot create observer with a non-function"
    })
  });
  it("should fail to initialize with null", () => {
    assert.throws((() => new Observer(null)), {
      name: "TypeError",
      message: "Cannot create observer with a non-function"
    })
  });
  it("should fail to initialize with undefined", () => {
    assert.throws((() => new Observer(undefined)), {
      name: "TypeError",
      message: "Cannot create observer with a non-function"
    })
  });
  it("should fail to initialize with number", () => {
    assert.throws((() => new Observer(1)), {
      name: "TypeError",
      message: "Cannot create observer with a non-function"
    })
  });
  it("should fail to initialize with string", () => {
    assert.throws((() => new Observer("a")), {
      name: "TypeError",
      message: "Cannot create observer with a non-function"
    })
  });
  it("should fail to initialize with object", () => {
    assert.throws((() => new Observer({})), {
      name: "TypeError",
      message: "Cannot create observer with a non-function"
    })
  });
  it("should fail to initialize with array", () => {
    assert.throws((() => new Observer([])), {
      name: "TypeError",
      message: "Cannot create observer with a non-function"
    })
  });
});

describe("Observering", () => {
  it("should trigger on initialization", () => {
    let tracker = 0;
    const observer = new Observer(() => tracker = 1);
    assert.equal(tracker, 1);
  });
  it("should trigger on Signal dependency write", () => {
    let tracker = 0;
    const signal = new Signal(1);
    const observer = new Observer(() => (tracker = signal()));
    signal(2);
    assert.equal(tracker, 2);
  });
  it("should trigger once per Signal dependency write", () => {
    let counter = 0;
    const signal = new Signal("foo");
    const observer = new Observer(() => {
      signal();
      counter += 1;
    });
    assert.equal(counter, 1);
    signal("bar");
    assert.equal(counter, 2);
    signal("foo");
    assert.equal(counter, 3);
  });
  it("should trigger on Reactor dependency write", () => {
    let tracker = 0;
    const reactor = new Reactor();
    reactor.foo = 1;
    const observer = new Observer(() => (tracker = reactor.foo));
    reactor.foo = 2;
    assert.equal(tracker, 2);
  });
  it("should trigger once per Reactor dependency write", () => {
    let counter = 0;
    const reactor = new Reactor();
    reactor.foo = "foo";
    const observer = new Observer(() => {
      counter += 1;
      reactor.foo;
    });
    assert.equal(counter, 1);
    reactor.foo = "bar";
    assert.equal(counter, 2);
    reactor.foo = "foo";
    assert.equal(counter, 3);
  });
  it("should trigger on Reactor dependency write", () => {
    let tracker = 0;
    const reactor = new Reactor();
    const observer = new Observer(() => (tracker = reactor.foo));
    reactor.foo = define(() => "foo");
    assert.equal(tracker, "foo");
  });
  it("should trigger on nested Reactor dependency write", () => {
    let tracker = 0;
    const reactor = new Reactor({
      foo: {
        bar: "baz"
      }
    });
    const observer = new Observer(() => (tracker = reactor.foo.bar));
    assert.equal(tracker, "baz");
    reactor.foo.bar = "moo";
    assert.equal(tracker, "moo");
  });
  it("should trigger on defineProperty", () => {
    let tracker = 0;
    const reactor = new Reactor({
      foo: "bar"
    });
    const observer = new Observer(() => (tracker = reactor.foo));
    Object.defineProperty(reactor, "foo", {
      get() { return "baz"; }
    })
    assert.equal(tracker, "baz");
  });
  it("should trigger on deleteProperty", () => {
    let tracker = 0;
    const reactor = new Reactor({
      foo: "bar"
    });
    const observer = new Observer(() => (tracker = reactor.foo));
    delete reactor.foo;
    assert.equal(tracker, undefined);
  });
  it("should be able to stop", () => {
    let tracker = null;
    let counter = 0;
    const signal = new Signal("foo");
    const observer = new Observer(() => {
      counter += 1;
      tracker = signal()
    });
    assert.equal(tracker, "foo");
    assert.equal(counter, 1);
    signal("bar");
    assert.equal(tracker, "bar");
    assert.equal(counter, 2);
    observer.stop();
    signal("moo");
    assert.equal(tracker, "bar");
    assert.equal(counter, 2);
  });
  it("should be able to start after stopping", () => {
    let tracker = null;
    let counter = 0;
    const signal = new Signal("foo");
    const observer = new Observer(() => {
      counter += 1;
      tracker = signal()
    });
    assert.equal(tracker, "foo");
    assert.equal(counter, 1);
    observer.stop();
    signal("moo");
    assert.equal(tracker, "foo");
    assert.equal(counter, 1);
    observer.start();
    assert.equal(tracker, "moo");
    assert.equal(counter, 2);
  });
  it("should start idempotently", () => {
    let tracker = null;
    let counter = 0;
    const signal = new Signal("foo");
    const observer = new Observer(() => {
      counter += 1;
      tracker = signal()
    });
    assert.equal(tracker, "foo");
    assert.equal(counter, 1);
    observer.stop();
    signal("moo");
    assert.equal(tracker, "foo");
    assert.equal(counter, 1);
    observer.start();
    assert.equal(tracker, "moo");
    assert.equal(counter, 2);
    observer.start();
    assert.equal(tracker, "moo");
    assert.equal(counter, 2);
  });
  it("should not infinite loop", () => {
    let tracker = null;
    let counter = 0;
    const signal = new Signal("foo");
    assert.throws(
      () => {
        const observer = new Observer(() => {
          counter += 1;
          tracker = signal();
          if (counter < 100) signal("bar");
        });
      },
      { 
        name: "LoopError",
        message: "observer attempted to activate itself while already executing"
      }
    )
    assert.equal(tracker, "foo");
    assert.equal(counter, 1);
  });
  it("should throw observer error from signal update", () => {
    const signal = new Signal(1);
    const observer = new Observer(() => {
      if (signal() > 1) throw new Error("dummy error");
    });
    assert.throws(() => signal(2), {
      name: "Error",
      message: "dummy error"
    });
  });
  it("should throw compound error if multiple observer errors", () => {
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
  it("should observe array methods", () => {
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
  it("should respect receiver context for prototype inheritors", () => {
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
})