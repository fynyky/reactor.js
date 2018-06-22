const assert = require("assert");
const { 
  Signal, 
  Reactor, 
  define, 
  Observer, 
  CompoundError,
  coreExtractor
} = require("./reactor");

describe("Signal", () => {
  // Initialization 
  it("should initialize boolean without error", () => new Signal(true));
  it("should initialize null without error", () => new Signal(null));
  it("should initialize undefined without error", () => new Signal(undefined));
  it("should initialize number without error", () => new Signal(1));
  it("should initialize string without error", () => new Signal("a"));
  it("should initialize symbol without error", () => new Signal(Symbol()));
  it("should initialize object without error", () => new Signal({}));
  it("should initialize array without error", () => new Signal([]));
  it("should initialize function without error", () => new Signal(() => {}));
  // Reading
  it("should read boolean without error", () => new Signal(true)());
  it("should read null without error", () => new Signal(null)());
  it("should read undefined without error", () => new Signal(undefined)());
  it("should read number without error", () => new Signal(1)());
  it("should read string without error", () => new Signal("a")());
  it("should read symbol without error", () => new Signal(Symbol())());
  it("should read object without error", () => new Signal({})());
  it("should read array without error", () => new Signal([])());
  it("should read function without error", () => new Signal(() => {})());
  // Reading Back
  it("should read initialized boolean value", () => {
    const value = true;
    const signal = new Signal(value);
    assert.equal(value, signal());
  });
  it("should read initialized null value", () => {
    const value = null;
    const signal = new Signal(value);
    assert.equal(value, signal());
  });
  it("should read initialized undefined value", () => {
    const value = undefined;
    const signal = new Signal(value);
    assert.equal(value, signal());
  });
  it("should read initialized number value", () => {
    const value = 1;
    const signal = new Signal(value);
    assert.equal(value, signal());
  });
  it("should read initialized string value", () => {
    const value = "a";
    const signal = new Signal(value);
    assert.equal(value, signal());
  });
  it("should read initialized symbol value", () => {
    const value = Symbol();
    const signal = new Signal(value);
    assert.equal(value, signal());
  });
  it("should not read initialized object value", () => {
    const value = {};
    const signal = new Signal(value);
    assert.notEqual(value, signal());
  });
  it("should not read initialized array value", () => {
    const value = [];
    const signal = new Signal(value);
    assert.notEqual(value, signal());
  });
  it("should not read initialized function value", () => {
    const value = () => {};
    const signal = new Signal(value);
    assert.notEqual(value, signal());
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
})
