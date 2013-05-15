# Reactor is a javascript framework for functional reactive programming
# It comprises of 2 primary components: Signals, and Observers
# 
# Signals represent values which can be observed
# Signals can depend on other signals
# When a signal is updated, it automatically updates all dependent signals as well
# 
# Observers represent reactions to changes in signals
# Observers are triggered after its dependent signals are updated
# 
# Observer and signal dependencies are set automatically 
# based on the observer/signal definition
# 
# When a signal is updated, it first updates all dependent signals
# After all dependnt signals have been updated, the relevant observers are notified
# From the perspective of observers, all signals are updated atomically and instantly 
# 
# TODOs
# events
# multi commit batching
# avoid removing array and setter methods if user overrides them

# global switcher depending on whether its node.js or in browser
global = exports ? this

# global stack to automatically track signal dependencies
# whenever a signal is evaluated - it puts itself on the dependency stack
# when other signals read their own value - they check dependency stack to see who is asking
# the top of the stack gets added as a dependent to the signal being read
# when a signals evaluation is done - it pops itself off the stack
dependencyStack = []

# Signals are functions representing observed values
# They are read by executing the function with no arguments
# They are set by executing the function with a signal definition as the only argument
# If the definition is a function - it is executed to retrive the signal value
# otherwise the definition is read as the value directly
# If a signal definition reads other signals, it automatically gets set as a dependent
# If any signal dependencies get updated, the signal is automatically updated as well
# Note that signal definition should NOT have any external effects
# They should only read values and not have any impact
# For external impacts - use observers
# to "destory" a signal - just pass set its value to null
global.Signal = (definition)->

  # stored value of this signal
  # only recalculated when definition has changed
  # or when a dependency notifies it to
  value = null

  # evaluate is a function to calculates the signal value given the definition
  # it recursively revaluates any signals that depend on it as well
  # Simultaneously, in order to know what observers to notify later
  # it recursively passes through a list to collect all the observers of the updated signals
  # After the signal cascade has completed, the observers on the list are notified
  evaluate = (observerList)->

    # by default the value is the definition
    value = definition

    # Set the special array methods if the definition is an array
    # Essentially providing convenience mutator methods which automatically trigger revaluation
    for methodName in ["pop", "push", "reverse", "shift", "sort", "splice", "unshift"]
      do (methodName)->
        if definition instanceof Array
          createdSignal[methodName] = ->
            output = definition[methodName].apply definition, arguments
            createdSignal(definition)
            return output
        else
          delete createdSignal[methodName]

    # convenience method for setting properties
    if definition instanceof Object
      createdSignal.set = (key, value)->
        definition[key] = value
        createdSignal(definition)
    else
      delete createdSignal.set

    # if definition is a function then we need to evaluate it
    # and set it up to be notified when its dependencies change
    if typeof definition is "function"

      # clear old dependencies
      for dependency in evaluate.dependencies
        dependentIndex = dependency.dependents.indexOf evaluate
        dependency.dependents.splice dependentIndex, 1
      evaluate.dependencies = []

      # evaluate the definition and set new dependencies
      dependencyStack.push evaluate
      value = definition()
      dependencyStack.pop()

    # Add this signals own observers to the observer list
    # Note that observers is a list of observer triggers instead of the observers themselves
    for observerTrigger in createdSignal.observers[...]
      observerList.push observerTrigger if (observerList.indexOf observerTrigger) < 0

    # Recursively evaluate any de pendents
    # Note that the dependents is a list of the dependents evaluate functions
    # not the signals themselves
    # and give them the observer list to add to as well
    # need to duplicate list since it will be modified by child evaluations
    for dependentEvaluate in createdSignal.dependents[...]
      dependentEvaluate(observerList)

  # List of signals that this depends on
  # Used to remove self from their dependents list when necessary
  # Note that while the dependents is a list of evaluate functions
  # dependencies is a list of the signals themselves
  evaluate.dependencies = []
  evaluate.dependencyType = "signal"

  # The actual returned function representing the signal
  createdSignal = (newDefinition)->

    # Write path
    # If a new definition is given, update the signal
    # recursively update any dependent signals
    # then finally trigger affected observers
    if newDefinition isnt undefined
      definition = newDefinition
      observerList = []
      evaluate(observerList)
      observerTrigger() for observerTrigger in observerList
      return value

    # Read path
    # If no definition is given, we treat it as a read call and return the cached value
    # Simultaneously, check for calling signals/observers and register dependenceis accordingly
    else
      
      # check the global stack for the most recent dependent being evaluated
      # assume this is the caller and set it as a dependent
      dependent = dependencyStack[dependencyStack.length - 1]

      # If its a signal dependency - register it as such
      if dependent? and dependent.dependencyType is "signal"

        # register it as a dependent if necessary
        existingDependentIndex = createdSignal.dependents.indexOf dependent
        createdSignal.dependents.push dependent if existingDependentIndex < 0

        # symmetrically - register self as a dependency
        # this is needed for cleaning dependencies later
        existingDependencyIndex = dependent.dependencies.indexOf createdSignal
        dependent.dependencies.push createdSignal if existingDependencyIndex < 0

      # If it is a observer dependency - similarly register it as a observer
      else if dependent? and dependent.dependencyType is "observer"

        # register the observer if necessary
        existingObserverIndex = createdSignal.observers.indexOf dependent
        createdSignal.observers.push dependent if existingObserverIndex < 0

        # symmetrically - register self as a observee
        # this is needed for cleaning obeserver dependencies later
        existingObserveeIndex = dependent.observees.indexOf createdSignal
        dependent.observees.push createdSignal if existingObserveeIndex < 0

      return value

  createdSignal.dependents = []
  createdSignal.observers = []

  # run an initial evaluation on creation
  # no need to notify observers/dependents because it shouldnt have any yet
  evaluate()
  return createdSignal

# Observers represent responses to signal changes
# They are defined in a manner similar to Signals
# The primary differences of observers are
# - they have no value to read
# - they cannot be observed themselves
# - they are notified only after signals have all been updated
# to remove an observer - just set its value to null
global.Observer = (response)->

  # Activate the observer as well as reconfigure dependencies
  trigger = ->

    # clear old observees
    for observee in trigger.observees
      observerIndex = observee.observers.indexOf trigger
      observee.observers.splice observerIndex, 1
    trigger.observees = []

    # do initial trigger and set up to listen for future updates
    dependencyStack.push trigger
    response() unless response is null
    dependencyStack.pop()

  trigger.observees = []
  trigger.dependencyType = "observer"

  # returned in the form of a function
  # as with signals - can be provided with a new definition
  createdObserver = (newResponse)->
    response = newResponse
    trigger()
    return null

  trigger()
  return createdObserver


# console.log "----------------------------------------------------------------"
# console.log "Begin Testing on " + new Date() 
# console.log "----------------------------------------------------------------"

# Signal = global.Signal
# Observer = global.Observer

# console.log "Single static signal"
# a = Signal 1
# console.log a() is 1
# console.log a(2) is 2
# console.log a() is 2
# console.log a(3) is 3
# console.log a() is 3

# console.log "Second static signal "
# a = Signal 1
# b = Signal 2
# console.log a() is 1
# console.log b() is 2
# console.log a() is 1
# console.log b(3) is 3
# console.log a() is 1
# console.log b() is 3
# console.log a() is 1
# console.log b(4) is 4
# console.log a() is 1
# console.log b() is 4

# console.log "Signal with simple single dependency"
# a = Signal 1
# b = Signal -> a()
# console.log a() is 1
# console.log b() is 1
# a(2)
# console.log a() is 2
# console.log b() is 2
# c = Signal 3
# console.log a() is 2
# console.log b() is 2

# console.log "multi dependents"
# a = Signal 1
# b = Signal -> a()
# c = Signal -> a() + 1
# console.log a() is 1
# console.log b() is 1
# console.log c() is 2
# a(2)
# console.log a() is 2
# console.log b() is 2
# console.log c() is 3

# console.log "Breaking dependency"
# a = Signal 1
# b = Signal -> a()
# console.log a() is 1
# console.log b() is 1
# a(2)
# console.log a() is 2
# console.log b() is 2
# b(3)
# console.log a() is 2
# console.log b() is 3
# a(7)
# console.log a() is 7
# console.log b() is 3

# console.log "Signal with modified single dependency"
# a = Signal 1
# b = Signal -> a() + 10
# console.log a() is 1
# console.log b() is 11
# a(2)
# console.log a() is 2
# console.log b() is 12

# console.log "Signal with simple chain dependency"
# a = Signal 1
# b = Signal -> a()
# c = Signal -> b()
# console.log a() is 1
# console.log b() is 1
# console.log c() is 1
# a(2)
# console.log a() is 2
# console.log b() is 2
# console.log c() is 2

# console.log "Signal with complex chain dependency"
# a = Signal 1
# b = Signal -> a() + 1
# c = Signal -> b() + 1
# console.log a() is 1
# console.log b() is 2
# console.log c() is 3
# a(4)
# console.log a() is 4
# console.log b() is 5
# console.log c() is 6

# console.log "Signal with multiple dependency"
# a = Signal 1
# b = Signal 2
# c = Signal -> a() + b()
# console.log a() is 1
# console.log b() is 2
# console.log c() is 3
# a(3)
# console.log a() is 3
# console.log b() is 2
# console.log c() is 5
# b(4)
# console.log a() is 3
# console.log b() is 4
# console.log c() is 7

# console.log "Multipath dependencies"
# a = Signal 1
# b = Signal -> a() + 1
# c = Signal -> a() + b()
# console.log a() is 1
# console.log b() is 2
# console.log c() is 3
# a(7)
# console.log a() is 7
# console.log b() is 8
# console.log c() is 15
# b(3)
# console.log a() is 7
# console.log b() is 3
# console.log c() is 10
# a(4)
# console.log a() is 4
# console.log b() is 3
# console.log c() is 7

# console.log "basic observer"
# a = Signal 1
# console.log a() is 1
# b = null
# console.log b is null
# c = Observer -> b = a()
# console.log b is 1
# a(2)
# console.log b is 2

# console.log "multi observer"
# a = Signal 1
# b = Signal -> a()
# c = Signal -> a()
# d = Signal -> c()
# e = 0
# f = Observer ->
#   e += a() + b() + c() + d()
# console.log e is 4
# a(2)
# console.log e is 12

# console.log "read write observer"
# a = Signal 1
# b = Signal 2
# console.log a() is 1
# console.log b() is 2
# c = Observer -> b(a())
# console.log b() is 1
# a(3)
# console.log a() is 3
# console.log b() is 3
# b(4)
# console.log a() is 3
# console.log b() is 4

# console.log "another read write observer"
# a = 0
# b = Signal 1
# c = Signal 2
# console.log a is 0
# console.log b() is 1
# console.log c() is 2
# d = Observer ->
#   a += 1
#   b()
#   c(3)
# console.log a is 1
# console.log b() is 1
# console.log c() is 3
# a = 4
# console.log a is 4
# console.log b() is 1
# console.log c() is 3
# b(6)
# console.log a is 5
# console.log b() is 6
# console.log c() is 3
# c(7)
# console.log a is 5
# console.log b() is 6
# console.log c() is 7

# console.log "object setter"
# a = Signal {}
# b = Signal -> "Serialized: " + JSON.stringify(a())
# console.log b() is "Serialized: {}"
# a()["x"] = 1
# console.log JSON.stringify(a()) is '{"x":1}'
# console.log b() is "Serialized: {}"
# a(a())
# console.log JSON.stringify(a()) is '{"x":1}'
# console.log b() is 'Serialized: {"x":1}'
# a.set("x", 2)
# console.log JSON.stringify(a()) is '{"x":2}'
# console.log b() is 'Serialized: {"x":2}'
# a(3)
# console.log a() is 3
# console.log b() is 'Serialized: 3'
# console.log a.set is undefined

# console.log "basic array push "
# a = Signal []
# a.push "x"
# console.log JSON.stringify(a()) is '["x"]'

# console.log "array initialized properly"
# a = Signal []
# a.push("x")
# console.log JSON.stringify(a()) is '["x"]'
# a.push("y")
# console.log JSON.stringify(a()) is '["x","y"]'
# a.pop()
# console.log JSON.stringify(a()) is '["x"]'
# a.pop()
# console.log JSON.stringify(a()) is '[]'
# a.unshift("x")
# console.log JSON.stringify(a()) is '["x"]'
# a.unshift("y")
# console.log JSON.stringify(a()) is '["y","x"]'
# a.unshift("z")
# console.log JSON.stringify(a()) is '["z","y","x"]'
# a.sort()
# console.log JSON.stringify(a()) is '["x","y","z"]'
# a.reverse()
# console.log JSON.stringify(a()) is '["z","y","x"]'
# a.splice(1,1,"w")
# console.log JSON.stringify(a()) is '["z","w","x"]'
# a.shift()
# console.log JSON.stringify(a()) is '["w","x"]'

# console.log "array methods"
# a = Signal []
# b = Signal -> "Serialized: " + JSON.stringify(a())
# console.log JSON.stringify(a()) is '[]'
# console.log b() is 'Serialized: []'
# a()[0] = "x"
# console.log JSON.stringify(a()) is '["x"]'
# console.log b() is 'Serialized: []'
# a(a())
# console.log JSON.stringify(a()) is '["x"]'
# console.log b() is 'Serialized: ["x"]'
# a.set(1, "y")
# console.log JSON.stringify(a()) is '["x","y"]'
# console.log b() is 'Serialized: ["x","y"]'
# a.push("z")
# console.log JSON.stringify(a()) is '["x","y","z"]'
# console.log b() is 'Serialized: ["x","y","z"]'
# a.unshift("w")
# console.log JSON.stringify(a()) is '["w","x","y","z"]'
# console.log b() is 'Serialized: ["w","x","y","z"]'
# c = a.shift()
# console.log JSON.stringify(a()) is '["x","y","z"]'
# console.log b() is 'Serialized: ["x","y","z"]'
# console.log c is "w"
# a.reverse()
# console.log JSON.stringify(a()) is '["z","y","x"]'
# console.log b() is 'Serialized: ["z","y","x"]'
# d = a.pop()
# console.log JSON.stringify(a()) is '["z","y"]'
# console.log b() is 'Serialized: ["z","y"]'
# a.push("foo")
# a.push("bar")
# console.log JSON.stringify(a()) is '["z","y","foo","bar"]'
# console.log b() is 'Serialized: ["z","y","foo","bar"]'
# d = a.splice(1,2)
# console.log JSON.stringify(d) is '["y","foo"]'
# console.log JSON.stringify(a()) is '["z","bar"]'
# console.log b() is 'Serialized: ["z","bar"]'
# a("pies")
# console.log a() is "pies"
# console.log b() is 'Serialized: "pies"'
# console.log a.pop is undefined
# console.log a.push is undefined
# console.log a.shift is undefined
# console.log a.unshift is undefined
# console.log a.sort is undefined
# console.log a.reverse is undefined
# console.log a.splice is undefined

# console.log "----------------------------------------------------------------"
# console.log "Completed Testing on " + new Date() 
# console.log "----------------------------------------------------------------"