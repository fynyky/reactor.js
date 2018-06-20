const assert = require("assert");
const { Signal, Reactor, define, CompoundError } = require("./reactor");

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
  it("should read initialized object value", () => {
    const value = {};
    const signal = new Signal(value);
    assert.equal(value, signal());
  });
  it("should read initialized array value", () => {
    const value = [];
    const signal = new Signal(value);
    assert.equal(value, signal());
  });
  it("should read initialized function value", () => {
    const value = () => {};
    const signal = new Signal(value);
    assert.equal(value, signal());
  });
});

describe("Reactor", () => {
  it("should initialize without error", () => new Reactor());
});

describe("Definition", () => {
  it("should initialize function without error", () => {
    define(() => {});
  });
  it("should failed to initialize with boolean", () => {
    assert.throws((() => define(true)), {
      name: "TypeError",
      message: "Cannot create definition with a non-function"
    })
  });
  it("should failed to initialize with null", () => {
    assert.throws((() => define(null)), {
      name: "TypeError",
      message: "Cannot create definition with a non-function"
    })
  });
  it("should failed to initialize with undefined", () => {
    assert.throws((() => define(undefined)), {
      name: "TypeError",
      message: "Cannot create definition with a non-function"
    })
  });
  it("should failed to initialize with number", () => {
    assert.throws((() => define(1)), {
      name: "TypeError",
      message: "Cannot create definition with a non-function"
    })
  });
  it("should failed to initialize with string", () => {
    assert.throws((() => define("a")), {
      name: "TypeError",
      message: "Cannot create definition with a non-function"
    })
  });
  it("should failed to initialize with object", () => {
    assert.throws((() => define({})), {
      name: "TypeError",
      message: "Cannot create definition with a non-function"
    })
  });
  it("should failed to initialize with array", () => {
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



