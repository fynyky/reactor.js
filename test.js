const assert = require("assert");
const { Signal, Observer, CompoundError } = require("./reactor");

describe("Signal", function() {
  describe("Initialization", () =>
    it("should initialize without error", function() {
      let objectSignal;
      const numberSignal = Signal(123456789);
      const stringSignal = Signal("foo");
      const arraySignal = Signal([]);
      objectSignal = Signal({});
    }));

  describe("Reading", function() {
    it("should read the inital value without error", function() {
      const numberSignal = Signal(123456789);
      const stringSignal = Signal("foo");
      const arraySignal = Signal([]);
      const objectSignal = Signal({});
      numberSignal();
      stringSignal();
      arraySignal();
      objectSignal();
    });

    it("should return the initial value when read", function() {
      const numberValue = 123456789;
      const stringValue = "foo";
      const arrayValue = [];
      const objectValue = {};
      const numberSignal = Signal(numberValue);
      const stringSignal = Signal(stringValue);
      const arraySignal = Signal(arrayValue);
      const objectSignal = Signal(objectValue);
      assert.equal(numberSignal(), 123456789);
      assert.equal(stringSignal(), "foo");
      assert.equal(arraySignal(), arrayValue);
      assert.equal(objectSignal(), objectValue);
    });

    it("should be readable multiple times without changing the value", function() {
      const aValue = 123456789;
      const a = Signal(123456789);
      assert.equal(a(), 123456789);
      assert.equal(a(), 123456789);
      assert.equal(a(), 123456789);
      assert.equal(a(), 123456789);
      assert.equal(a(), 123456789);
    });
  });

  describe("Writing", function() {
    it("should write a new value without error", function() {
      const numberSignal = Signal(123456789);
      const stringSignal = Signal("foo");
      const arraySignal = Signal([]);
      const objectSignal = Signal({});
      numberSignal(987654321);
      stringSignal("bar");
      arraySignal([]);
      objectSignal({});
    });

    it("should return the written value on write", function() {
      const numberSignal = Signal(123456789);
      const stringSignal = Signal("foo");
      const arraySignal = Signal(["a", "b", "c"]);
      const objectSignal = Signal({ foo: 1 });
      const newNumberValue = 987654321;
      const newStringValue = "bar";
      const newArrayValue = [1, 2, 3];
      const newObjectValue = { bar: 2 };
      assert.equal(numberSignal(newNumberValue), newNumberValue);
      assert.equal(stringSignal(newStringValue), newStringValue);
      assert.equal(arraySignal(newArrayValue), newArrayValue);
      assert.equal(objectSignal(newObjectValue), newObjectValue);
    });

    it("should return the new value on subsequent reads", function() {
      const numberSignal = Signal(123456789);
      const stringSignal = Signal("foo");
      const arraySignal = Signal(["a", "b", "c"]);
      const objectSignal = Signal({ foo: 1 });
      const newNumberValue = 987654321;
      const newStringValue = "bar";
      const newArrayValue = [1, 2, 3];
      const newObjectValue = { bar: 2 };
      numberSignal(newNumberValue);
      stringSignal(newStringValue);
      arraySignal(newArrayValue);
      objectSignal(newObjectValue);
      assert.equal(numberSignal(), newNumberValue);
      assert.equal(stringSignal(), newStringValue);
      assert.equal(arraySignal(), newArrayValue);
      assert.equal(objectSignal(), newObjectValue);
    });
  });

  describe("Propagation", function() {
    it("should initialize a dependent signal without error", function() {
      let b;
      const a = Signal(1);
      b = Signal(() => a() + 1);
    });

    it("should initialize a dependent signal with the correct value", function() {
      const a = Signal(1);
      const b = Signal(() => a() + 1);
      assert.equal(b(), 2);
    });

    it("should propagate changes to a dependent signal", function() {
      const a = Signal(1);
      const b = Signal(() => a() + 1);
      a(2);
      assert.equal(b(), 3);
    });

    it("should initialize multiple dependent signals without error", function() {
      let c;
      const a = Signal(1);
      const b = Signal(() => a() + 1);
      c = Signal(() => a() + 2);
    });

    it("should initialize multiple dependent signals with the correct values", function() {
      const a = Signal(1);
      const b = Signal(() => a() + 1);
      const c = Signal(() => a() + 2);
      assert.equal(a(), 1);
      assert.equal(b(), 2);
      assert.equal(c(), 3);
    });

    it("should propagate changes to multiple dependent signals", function() {
      const a = Signal(1);
      const b = Signal(() => a() + 1);
      const c = Signal(() => a() + 2);
      a(2);
      assert.equal(a(), 2);
      assert.equal(b(), 3);
      assert.equal(c(), 4);
    });

    it("should initialize sequential dependencies without error", function() {
      let d;
      const a = Signal(1);
      const b = Signal(() => a() + 1);
      const c = Signal(() => b() + 1);
      d = Signal(() => c() + 1);
    });

    it("should initialize sequential dependencies with the correct values", function() {
      const a = Signal(1);
      const b = Signal(() => a() + 1);
      const c = Signal(() => b() + 1);
      const d = Signal(() => c() + 1);
      assert.equal(a(), 1);
      assert.equal(b(), 2);
      assert.equal(c(), 3);
      assert.equal(d(), 4);
    });

    it("should propagate changes to sequential dependencies", function() {
      const a = Signal(1);
      const b = Signal(() => a() + 1);
      const c = Signal(() => b() + 1);
      const d = Signal(() => c() + 1);
      a(10);
      assert.equal(a(), 10);
      assert.equal(b(), 11);
      assert.equal(c(), 12);
      assert.equal(d(), 13);
    });

    it("should initialize convergent dependencies without error", function() {
      let c;
      const a = Signal(1);
      const b = Signal(2);
      c = Signal(() => a() + b());
    });

    it("should initialize convergent dependencies with the correct value", function() {
      const a = Signal(1);
      const b = Signal(2);
      const c = Signal(() => a() + b());
      assert.equal(a(), 1);
      assert.equal(b(), 2);
      assert.equal(c(), 3);
    });

    it("should propagate changes to convergent dependencies", function() {
      const a = Signal(1);
      const b = Signal(2);
      const c = Signal(() => a() + b());
      a(7);
      assert.equal(a(), 7);
      assert.equal(b(), 2);
      assert.equal(c(), 9);
      b(3);
      assert.equal(a(), 7);
      assert.equal(b(), 3);
      assert.equal(c(), 10);
    });

    it("should break unneeded dependencies after manual redefinition", function() {
      const a = Signal(1);
      const b = Signal(() => a());
      assert.equal(a(), 1);
      assert.equal(b(), 1);
      a(2);
      assert.equal(a(), 2);
      assert.equal(b(), 2);
      b(3);
      assert.equal(a(), 2);
      assert.equal(b(), 3);
      a(7);
      assert.equal(a(), 7);
      assert.equal(b(), 3);
    });

    it("should dynamically determine dependencies", function() {
      let triggerCount = 0;
      const a = Signal(true);
      const b = Signal("foo");
      const c = Signal("bar");
      const d = Signal(function() {
        triggerCount += 1;
        if (a()) {
          return b();
        } else {
          return c();
        }
      });
      assert.equal(triggerCount, 1); // initialization evaluation
      b("hi");
      assert.equal(triggerCount, 2); // trigger on b's update
      c("hello");
      assert.equal(triggerCount, 2); // no triggering on c's update
      a(false);
      assert.equal(triggerCount, 3); // trigger on a's update
      c("hello again");
      assert.equal(triggerCount, 4); // now trigger on c's update
      b("hi again");
      assert.equal(triggerCount, 4);
    }); // no triggers on b's update anymore

    it("should only propagate changes to signals which have not seen the value already", function() {
      let triggerCount = 0;
      const a = Signal(1);
      const b = Signal(() => a() + 1);
      const c = Signal(function() {
        a() + b();
        triggerCount += 1;
      });
      a(2);
      // c should only be evaluatated twice
      // first when it is initialized
      // second when a propagates to b which propagates to c
      // since c reads a after being notified by b
      // a does not need to propagate to c again
      assert.equal(triggerCount, 2);
    });

    it("should correctly assign dependencies for nested signal definitions", function() {
      let outerUpdates = 0;
      let innerUpdates = 0;
      const a = Signal("a");
      const b = Signal("b");
      const c = Signal("c");
      const outer = Signal(() => {
        outerUpdates += 1;
        let outerValue = [a()];
        let inner = Signal(() => {
          innerUpdates += 1;
          return b();
        });
        outerValue.push(inner);
        outerValue.push(c());
        return outerValue;
      }); 
      assert.equal(outerUpdates, 1);
      assert.equal(innerUpdates, 1);
      // Should trigger an inner update but not an outer update
      b("B");
      assert.equal(outerUpdates, 1);
      assert.equal(innerUpdates, 2);
      // Should trigger an outer update and an inner update
      c("C");
      assert.equal(outerUpdates, 2);
      assert.equal(innerUpdates, 3);
    });
  });

  describe("Array and Object convenience methods", function() {
    it("should be able to call object set without error", function() {
      const aSignal = Signal({});
      aSignal.set("foo", 1);
    });

    it("should have its value using object set", function() {
      const aSignal = Signal({});
      aSignal.set("foo", 1);
      assert.equal(JSON.stringify(aSignal()), '{"foo":1}');
      aSignal.set("bar", 2);
      assert.equal(JSON.stringify(aSignal()), '{"foo":1,"bar":2}');
    });

    it("should not have set on non object signals`", function() {
      const aSignal = Signal(1);
      assert.equal(aSignal.set, undefined);
    });

    it("should remove set once signal is no longer object", function() {
      const aSignal = Signal({});
      aSignal(1);
      assert.equal(aSignal.set, undefined);
    });

    it("should propagate the value when using the object set convenience method", function() {
      const aSignal = Signal({});
      const bSignal = Signal(() => `Serialized: ${JSON.stringify(aSignal())}`);
      assert.equal(JSON.stringify(aSignal()), "{}");
      aSignal.set("foo", 1);
      assert.equal(bSignal(), 'Serialized: {"foo":1}');
    });

    it("should call array mutator convenience methods without error", function() {
      const arraySignal = Signal([]);
      arraySignal.push("x");
      arraySignal.pop();
      arraySignal.unshift("x");
      arraySignal.shift();
      arraySignal.sort((x, y) => x(-y));
      arraySignal.reverse();
      arraySignal.splice(0, 0, "x");
    });

    it("should modify the array correctly when using array convenience methods", function() {
      const controlArray = [];
      const arraySignal = Signal([]);
      let controlOutput = controlArray.push("x");
      let signalOutput = arraySignal.push("x");
      assert.equal(JSON.stringify(arraySignal()), JSON.stringify(controlArray));
      assert.equal(JSON.stringify(controlOutput), JSON.stringify(signalOutput));
      controlOutput = controlArray.push("y");
      signalOutput = arraySignal.push("y");
      assert.equal(JSON.stringify(arraySignal()), JSON.stringify(controlArray));
      assert.equal(JSON.stringify(controlOutput), JSON.stringify(signalOutput));
      controlOutput = controlArray.push("z");
      signalOutput = arraySignal.push("z");
      assert.equal(JSON.stringify(arraySignal()), JSON.stringify(controlArray));
      assert.equal(JSON.stringify(controlOutput), JSON.stringify(signalOutput));
      controlOutput = controlArray.pop();
      signalOutput = arraySignal.pop();
      assert.equal(JSON.stringify(arraySignal()), JSON.stringify(controlArray));
      assert.equal(JSON.stringify(controlOutput), JSON.stringify(signalOutput));
      controlOutput = controlArray.pop();
      signalOutput = arraySignal.pop();
      assert.equal(JSON.stringify(arraySignal()), JSON.stringify(controlArray));
      assert.equal(JSON.stringify(controlOutput), JSON.stringify(signalOutput));
      controlOutput = controlArray.pop();
      signalOutput = arraySignal.pop();
      assert.equal(JSON.stringify(arraySignal()), JSON.stringify(controlArray));
      assert.equal(JSON.stringify(controlOutput), JSON.stringify(signalOutput));
      controlOutput = controlArray.unshift("a");
      signalOutput = arraySignal.unshift("a");
      assert.equal(JSON.stringify(arraySignal()), JSON.stringify(controlArray));
      assert.equal(JSON.stringify(controlOutput), JSON.stringify(signalOutput));
      controlOutput = controlArray.unshift("b");
      signalOutput = arraySignal.unshift("b");
      assert.equal(JSON.stringify(arraySignal()), JSON.stringify(controlArray));
      assert.equal(JSON.stringify(controlOutput), JSON.stringify(signalOutput));
      controlOutput = controlArray.unshift("c");
      signalOutput = arraySignal.unshift("c");
      assert.equal(JSON.stringify(arraySignal()), JSON.stringify(controlArray));
      assert.equal(JSON.stringify(controlOutput), JSON.stringify(signalOutput));
      controlOutput = controlArray.shift();
      signalOutput = arraySignal.shift();
      assert.equal(JSON.stringify(arraySignal()), JSON.stringify(controlArray));
      assert.equal(JSON.stringify(controlOutput), JSON.stringify(signalOutput));
      controlOutput = controlArray.shift();
      signalOutput = arraySignal.shift();
      assert.equal(JSON.stringify(arraySignal()), JSON.stringify(controlArray));
      assert.equal(JSON.stringify(controlOutput), JSON.stringify(signalOutput));
      controlOutput = controlArray.shift();
      signalOutput = arraySignal.shift();
      assert.equal(JSON.stringify(arraySignal()), JSON.stringify(controlArray));
      assert.equal(JSON.stringify(controlOutput), JSON.stringify(signalOutput));
      controlOutput = controlArray.push(4, 2, 3, 1, 5);
      signalOutput = arraySignal.push(4, 2, 3, 1, 5);
      controlOutput = controlArray.sort((x, y) => x - y);
      signalOutput = arraySignal.sort((x, y) => x - y);
      assert.equal(JSON.stringify(arraySignal()), JSON.stringify(controlArray));
      assert.equal(JSON.stringify(controlOutput), JSON.stringify(signalOutput));
      controlOutput = controlArray.reverse();
      signalOutput = arraySignal.reverse();
      assert.equal(JSON.stringify(arraySignal()), JSON.stringify(controlArray));
      assert.equal(JSON.stringify(controlOutput), JSON.stringify(signalOutput));
      controlOutput = controlArray.splice(1, 1, "hello there");
      signalOutput = arraySignal.splice(1, 1, "hello there");
      assert.equal(JSON.stringify(arraySignal()), JSON.stringify(controlArray));
      assert.equal(JSON.stringify(controlOutput), JSON.stringify(signalOutput));
    });

    it("should propagate changes when using array convenience methods", function() {
      const arraySignal = Signal([]);
      const dependentSignal = Signal(() => JSON.stringify(arraySignal));
      arraySignal.push("x");
      assert.equal(dependentSignal(), JSON.stringify(arraySignal));
      arraySignal.push("y");
      assert.equal(dependentSignal(), JSON.stringify(arraySignal));
      arraySignal.push("z");
      assert.equal(dependentSignal(), JSON.stringify(arraySignal));
      arraySignal.pop();
      assert.equal(dependentSignal(), JSON.stringify(arraySignal));
      arraySignal.pop();
      assert.equal(dependentSignal(), JSON.stringify(arraySignal));
      arraySignal.pop();
      assert.equal(dependentSignal(), JSON.stringify(arraySignal));
      arraySignal.unshift("a");
      assert.equal(dependentSignal(), JSON.stringify(arraySignal));
      arraySignal.unshift("b");
      assert.equal(dependentSignal(), JSON.stringify(arraySignal));
      arraySignal.unshift("c");
      assert.equal(dependentSignal(), JSON.stringify(arraySignal));
      arraySignal.shift();
      assert.equal(dependentSignal(), JSON.stringify(arraySignal));
      arraySignal.shift();
      assert.equal(dependentSignal(), JSON.stringify(arraySignal));
      arraySignal.shift();
      assert.equal(dependentSignal(), JSON.stringify(arraySignal));
      arraySignal.push(4, 2, 3, 1, 5);
      arraySignal.sort((x, y) => x - y);
      assert.equal(dependentSignal(), JSON.stringify(arraySignal));
      arraySignal.reverse();
      assert.equal(dependentSignal(), JSON.stringify(arraySignal));
      arraySignal.splice(1, 1, "hello there");
      assert.equal(dependentSignal(), JSON.stringify(arraySignal));
    });
  });
});

describe("Observer", function() {
  it("should initialize a blank observer without error", function() {
    let anObserver;
    anObserver = Observer(function() {});
  });

  it("should initialize an observer which reads a signal without error", function() {
    let anObserver;
    const aSignal = Signal(1);
    anObserver = Observer(() => aSignal());
  });

  it("should trigger an observer on evaluation", function() {
    const aSignal = Signal(1);
    let anExternalValue = null;
    assert.equal(anExternalValue, null);
    const anObserver = Observer(() => (anExternalValue = aSignal()));
    assert.equal(anExternalValue, 1);
  });

  it("should trigger the observer when a signal is updated", function() {
    const aSignal = Signal(1);
    let anExternalValue = null;
    const anObserver = Observer(() => (anExternalValue = aSignal()));
    aSignal(2);
    assert.equal(anExternalValue, 2);
  });

  it("should trigger the observer when a signal is updated multiple times", function() {
    const aSignal = Signal(1);
    let anExternalValue = null;
    const anObserver = Observer(() => (anExternalValue = aSignal()));
    aSignal(2);
    assert.equal(anExternalValue, 2);
    aSignal(3);
    assert.equal(anExternalValue, 3);
    aSignal(4);
    assert.equal(anExternalValue, 4);
    aSignal(5);
    return assert.equal(anExternalValue, 5);
  });

  it("should trigger even when observing multiple signals", function() {
    const aSignal = Signal(1);
    const bSignal = Signal(2);
    const cSignal = Signal(3);
    const dSignal = Signal(4);
    let anExternalValue = 0;
    const anObserver = Observer(
      () =>
        (anExternalValue = `${aSignal()}${bSignal()}${cSignal()}${dSignal()}`)
    );
    assert.equal(anExternalValue, "1234");
    aSignal(5);
    assert.equal(anExternalValue, "5234");
    bSignal(6);
    assert.equal(anExternalValue, "5634");
    cSignal(7);
    assert.equal(anExternalValue, "5674");
    dSignal(8);
    assert.equal(anExternalValue, "5678");
  });

  it("should write to another signal without building a dependency", function() {
    let triggerCount = 0;
    const aSignal = Signal(1);
    const bSignal = Signal(2);
    const anObserver = Observer(function() {
      triggerCount += 1;
      bSignal(aSignal());
    });
    assert.equal(triggerCount, 1);
    assert.equal(bSignal(), 1);
    aSignal(3);
    assert.equal(triggerCount, 2);
    assert.equal(bSignal(), 3);
    bSignal(4);
    assert.equal(triggerCount, 2); // trigger count should stay the same since b was written not read
    assert.equal(bSignal(), 4);
  });
});

describe("Error Handling", function() {
  it("should throw error immediately on invalid signal definition", function() {
    const sourceSignal = Signal(1);
    try {
      const errorfulDependentSignal = Signal(
        () => sourceSignal() + nonExistentVariable
      );
    } catch (error) {
      if (!(error instanceof ReferenceError)) {
        throw error;
      }
      return;
    }
    throw new Error("no error when errors expected");
  });

  it("should throw a CompoundError if multiple signals are affected", function() {
    const sourceSignal = Signal(1);
    const firstErrorfulDependentSignal = Signal(function() {
      if (sourceSignal() > 2) {
        throw new RangeError("source too big!");
      } else {
        return sourceSignal();
      }
    });
    const secondErrorfulDependentSignal = Signal(() =>
      firstErrorfulDependentSignal()
    );
    const thirdErrorfulDependentSignal = Signal(() =>
      secondErrorfulDependentSignal()
    );
    try {
      sourceSignal(5);
    } catch (error) {
      if (!(error instanceof CompoundError)) {
        throw error;
      }
      return;
    }
    throw new Error("no error when errors expected");
  });

  it("should throw an error even if only observers are affected", function() {
    const sourceSignal = Signal(1);
    const errorfulObserver = Observer(function() {
      if (sourceSignal() > 2) {
        throw new RangeError("source too big!");
      } else {
        return sourceSignal();
      }
    });
    try {
      sourceSignal(5);
    } catch (error) {
      return;
    }
    throw new Error("no error when error expected");
  });
});
