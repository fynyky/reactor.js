assert = require 'assert'

{Signal, Observer} = require './reactor'

describe 'Signal', ->

  it 'Creating numerical signal', ->
    a = Signal 1


  it 'Single static signal', ->
    a = Signal 1

    assert.equal a() , 1
    assert.equal a(2), 2
    assert.equal a() , 2
    assert.equal a(3), 3
    assert.equal a() , 3

  it 'Second static signal', ->
    a = Signal 1
    b = Signal 2

    assert.equal a(), 1
    assert.equal b(), 2
    assert.equal a(), 1
    assert.equal b(3), 3
    assert.equal a(), 1
    assert.equal b(), 3
    assert.equal a(), 1
    assert.equal b(4), 4
    assert.equal a(), 1
    assert.equal b(), 4

  it "Signal with simple single dependency", ->
    a = Signal 1
    b = Signal -> a()
    assert.equal a(), 1
    assert.equal b(), 1
    a(2)
    assert.equal a(), 2
    assert.equal b(), 2
    c = Signal 3
    assert.equal a(), 2
    assert.equal b(), 2

  it "multi dependents", ->
    a = Signal 1
    b = Signal -> a()
    c = Signal -> a() + 1
    assert.equal a(), 1
    assert.equal b(), 1
    assert.equal c(), 2
    a(2)
    assert.equal a(), 2
    assert.equal b(), 2
    assert.equal c(), 3

  it "Breaking dependency", ->
    a = Signal 1
    b = Signal -> a()
    assert.equal a(), 1
    assert.equal b(), 1
    a(2)
    assert.equal a(), 2
    assert.equal b(), 2
    b(3)
    assert.equal a(), 2
    assert.equal b(), 3
    a(7)
    assert.equal a(), 7
    assert.equal b(), 3

  it "Signal with modified single dependency", ->
    a = Signal 1
    b = Signal -> a() + 10
    assert.equal a(), 1
    assert.equal b(), 11
    a(2)
    assert.equal a(), 2
    assert.equal b(), 12

  it "Signal with simple chain dependency", ->
    a = Signal 1
    b = Signal -> a()
    c = Signal -> b()
    assert.equal a(), 1
    assert.equal b(), 1
    assert.equal c(), 1
    a(2)
    assert.equal a(), 2
    assert.equal b(), 2
    assert.equal c(), 2

  it "Signal with complex chain dependency", ->
    a = Signal 1
    b = Signal -> a() + 1
    c = Signal -> b() + 1
    assert.equal a(), 1
    assert.equal b(), 2
    assert.equal c(), 3
    a(4)
    assert.equal a(), 4
    assert.equal b(), 5
    assert.equal c(), 6

  it "Signal with multiple dependency", ->
    a = Signal 1
    b = Signal 2
    c = Signal -> a() + b()
    assert.equal a(), 1
    assert.equal b(), 2
    assert.equal c(), 3
    a(3)
    assert.equal a(), 3
    assert.equal b(), 2
    assert.equal c(), 5
    b(4)
    assert.equal a(), 3
    assert.equal b(), 4
    assert.equal c(), 7

  it "Multipath dependencies", ->
    a = Signal 1
    b = Signal -> a() + 1
    c = Signal -> a() + b()
    assert.equal a(), 1
    assert.equal b(), 2
    assert.equal c(), 3
    a(7)
    assert.equal a(), 7
    assert.equal b(), 8
    assert.equal c(), 15
    b(3)
    assert.equal a(), 7
    assert.equal b(), 3
    assert.equal c(), 10
    a(4)
    assert.equal a(), 4
    assert.equal b(), 3
    assert.equal c(), 7

  it "avoid redundant multipath triggering", ->
    cCount = 0
    a = Signal 1
    b = Signal -> a() + 1
    c = Signal -> 
      a() + b()
      cCount += 1
    a(2)
    assert.equal cCount, 2

describe "Observer", ->
  it "basic observer", ->
    a = Signal 1
    assert.equal a(), 1
    b = null
    assert.equal b, null
    c = Observer -> b = a()
    assert.equal b, 1
    a(2)
    assert.equal b, 2

  it "multi observer", ->
    a = Signal 1
    b = Signal -> a()
    c = Signal -> a()
    d = Signal -> c()
    e = 0
    f = Observer ->
      e += a() + b() + c() + d()
    assert.equal e, 4
    a(2)
    assert.equal e, 12

  it "read write observer", ->
    a = Signal 1
    b = Signal 2
    assert.equal a(), 1
    assert.equal b(), 2
    c = Observer -> b(a())
    assert.equal b(), 1
    a(3)
    assert.equal a(), 3
    assert.equal b(), 3
    b(4)
    assert.equal a(), 3
    assert.equal b(), 4

  it "another read write observer", ->
    a = 0
    b = Signal 1
    c = Signal 2
    assert.equal a, 0
    assert.equal b(), 1
    assert.equal c(), 2
    d = Observer ->
      a += 1
      b()
      c(3)
    assert.equal a, 1
    assert.equal b(), 1
    assert.equal c(), 3
    a = 4
    assert.equal a, 4
    assert.equal b(), 1
    assert.equal c(), 3
    b(6)
    assert.equal a, 5
    assert.equal b(), 6
    assert.equal c(), 3
    c(7)
    assert.equal a, 5
    assert.equal b(), 6
    assert.equal c(), 7

  it "object setter", ->
    a = Signal {}
    b = Signal -> "Serialized: " + JSON.stringify(a())
    assert.equal b(), "Serialized: {}"
    a()["x"] = 1
    assert.equal JSON.stringify(a()), '{"x":1}'
    assert.equal b(), "Serialized: {}"
    a(a())
    assert.equal JSON.stringify(a()), '{"x":1}'
    assert.equal b(), 'Serialized: {"x":1}'
    a.set("x", 2)
    assert.equal JSON.stringify(a()), '{"x":2}'
    assert.equal b(), 'Serialized: {"x":2}'
    a(3)
    assert.equal a(), 3
    assert.equal b(), 'Serialized: 3'
    assert.equal a.set, undefined

  it "basic array push ", ->
    a = Signal []
    a.push "x"
    assert.equal JSON.stringify(a()), '["x"]'

  it "array initialized properly", ->
    a = Signal []
    a.push("x")
    assert.equal JSON.stringify(a()), '["x"]'
    a.push("y")
    assert.equal JSON.stringify(a()), '["x","y"]'
    a.pop()
    assert.equal JSON.stringify(a()), '["x"]'
    a.pop()
    assert.equal JSON.stringify(a()), '[]'
    a.unshift("x")
    assert.equal JSON.stringify(a()), '["x"]'
    a.unshift("y")
    assert.equal JSON.stringify(a()), '["y","x"]'
    a.unshift("z")
    assert.equal JSON.stringify(a()), '["z","y","x"]'
    a.sort()
    assert.equal JSON.stringify(a()), '["x","y","z"]'
    a.reverse()
    assert.equal JSON.stringify(a()), '["z","y","x"]'
    a.splice(1,1,"w")
    assert.equal JSON.stringify(a()), '["z","w","x"]'
    a.shift()
    assert.equal JSON.stringify(a()), '["w","x"]'

  it "array methods", ->
    a = Signal []
    b = Signal -> "Serialized: " + JSON.stringify(a())
    assert.equal JSON.stringify(a()), '[]'
    assert.equal b(), 'Serialized: []'
    a()[0] = "x"
    assert.equal JSON.stringify(a()), '["x"]'
    assert.equal b(), 'Serialized: []'
    a(a())
    assert.equal JSON.stringify(a()), '["x"]'
    assert.equal b(), 'Serialized: ["x"]'
    a.set(1, "y")
    assert.equal JSON.stringify(a()), '["x","y"]'
    assert.equal b(), 'Serialized: ["x","y"]'
    a.push("z")
    assert.equal JSON.stringify(a()), '["x","y","z"]'
    assert.equal b(), 'Serialized: ["x","y","z"]'
    a.unshift("w")
    assert.equal JSON.stringify(a()), '["w","x","y","z"]'
    assert.equal b(), 'Serialized: ["w","x","y","z"]'
    c = a.shift()
    assert.equal JSON.stringify(a()), '["x","y","z"]'
    assert.equal b(), 'Serialized: ["x","y","z"]'
    assert.equal c, "w"
    a.reverse()
    assert.equal JSON.stringify(a()), '["z","y","x"]'
    assert.equal b(), 'Serialized: ["z","y","x"]'
    d = a.pop()
    assert.equal JSON.stringify(a()), '["z","y"]'
    assert.equal b(), 'Serialized: ["z","y"]'
    a.push("foo")
    a.push("bar")
    assert.equal JSON.stringify(a()), '["z","y","foo","bar"]'
    assert.equal b(), 'Serialized: ["z","y","foo","bar"]'
    d = a.splice(1,2)
    assert.equal JSON.stringify(d), '["y","foo"]'
    assert.equal JSON.stringify(a()), '["z","bar"]'
    assert.equal b(), 'Serialized: ["z","bar"]'
    a("pies")
    assert.equal a(), "pies"
    assert.equal b(), 'Serialized: "pies"'
    assert.equal a.pop, undefined
    assert.equal a.push, undefined
    assert.equal a.shift, undefined
    assert.equal a.unshift, undefined
    assert.equal a.sort, undefined
    assert.equal a.reverse, undefined
    assert.equal a.splice, undefined