# Reactor is a javascript library for reactive programming
# It comprises of 2 primary components: Signals, and Observers

# Signals represent values which can be observed
# A signal's value can depend on one or more other signals

# Observers represent reactions to changes in signals
# An observer can be observing one or more signals

# Together, signals and observers form a directed acyclic graph
# Signals form the root and intermediate nodes of the graph
# Observers form the leaf nodes in the graph
# When a signal is updated, it propagates its changes through the graph
# Observers are updated last after all affected signals have been updated
# From the perspective of observers, all signals are updated atomically and instantly 

# In Reactor, observer and signal dependencies are set automatically and dynamically
# Reactor detects when a signal is being used at run time, and automatically establishes the link
# This means there is no need to explicitly declare dependencies
# And dependencies can be changed across the execution of the program

# TODOs
# remove redundant triggering when same value is made
# add in ability to get old values
# recompile with latest coffeescript compiler
# events
# multi commit batching
# avoid removing array and setter methods if user overrides them

# In node.js, Reactor is packaged into the exports object as a module import
# In the browser, Reactor is bound directly to the window namespace
global = exports ? this

# Global stack to automatically track signal dependencies
# Whenever a signal or observer is evaluated - it puts itself on the dependency stack
# When another signals is read - the dependency stack is checked to see who is asking
# The reader gets added as a dependent to the signal being read
# wWen a signal or observer's evaluation is done - it pops itself off the stack
dependencyStack = []

# Signals are functions representing observed values
# They are read by executing the function with no arguments
# They are set by executing the function with a signal definition as the only argument
# If the definition is itself a function - it is executed to retrive the signal value
# Otherwise, the definition is read as the value directly
# If a signal definition reads other signals, it automatically gets set as a dependent
# If any signal dependencies get updated, the dependent signal is automatically updated as well
# Note that a signal's definition should NOT have any external effects
# It should only read other values and return its own value
# For external effects, use observers instead
# To "destory" a signal, just set its definition to null
# -----------------------------------------------------------------------------
# Signals themselves have 3 main components 
#   A value - the cached value returned when the signal is read
#   An evaluate function - the "guts" which sets the value and handles propagation
#   The signal function - a wrapper providing the interface to read and write to the signal
global.Signal = (definition)->

  # Cached value of this signal calculated by the evaluate function
  # Recalculated when a definition has changed or when notified by a dependency
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
    arrayMethods = ["pop", "push", "reverse", "shift", "sort", "splice", "unshift"]
    if definition instanceof Array
      for methodName in arrayMethods
        do (methodName)->
          createdSignal[methodName] = ->
            output = definition[methodName].apply definition, arguments
            createdSignal(definition) # Manually trigger the refresh
            return output
    else 
      for methodName in arrayMethods
        delete createdSignal[methodName]

    # convenience method for setting properties
    if definition instanceof Object
      createdSignal.set = (key, value)->
        definition[key] = value
        createdSignal(definition) # Manually trigger the refresh
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
      dependencyStack.unshift evaluate
      value = definition()
      dependencyStack.shift()

    # Add this signals own observers to the observer list
    # Note that observers is a list of observer triggers instead of the observers themselves
    for observerTrigger in evaluate.observers[...]
      observerList.push observerTrigger if (observerList.indexOf observerTrigger) < 0

    # A copy of the dependents to be evaluated
    # This is used to avoid redundant evaluation where a descendent has
    # already read from this value
    # Check to see if a dependent is still on this list before evaluating it
    # If a descendent reads from this signal at some point
    # it will remove itself from this list
    evaluate.dependentTargets = evaluate.dependents[...]

    # Recursively evaluate any dependents
    # Note that the dependents is a list of the dependents evaluate functions
    # not the signals themselves
    # and give them the observer list to add to as well
    # need to duplicate list since it will be modified by child evaluations
    for dependentEvaluate in evaluate.dependents[...]
      if evaluate.dependentTargets.indexOf(dependentEvaluate) >= 0
        dependentEvaluate(observerList)

  # List of signals that this depends on
  # Used to remove self from their dependents list when necessary
  # Note that while the dependents is a list of evaluate functions
  # dependencies is a list of the signals themselves
  evaluate.dependencies = []
  evaluate.dependencyType = "signal"

  # Symmetrically - the list of other signals and observers that depend on this signal
  # Used to know who to notify when this signal has been updatedls
  evaluate.dependents = []
  evaluate.observers = []
  evaluate.dependentTargets = []

  # The actual signal function that is returned to the caller
  # Read by calling with no arguments
  # Write by calling with a new argument
  # Array methods if previously given an array as a definition
  # "set" convenience method if given an object/array as a definition
  createdSignal = (newDefinition)->

    # Write path
    # If a new definition is given, update the signal
    # recursively update any dependent signals
    # then finally trigger affected observers
    # -------------------------------------------------------------------------
    # Life of a write
    #   new definition is set
    #   delete/configure convenience methods
    #   execute new definition if necessary
    #   add observers to notify later
    #   make list of target dependents to be notified
    #   recursively evaluate dependents
    #     delete/configure convenience methods
    #     execute new definition
    #     get removed from target dependents list
    #     add observers to notify later
    #   notify observers
    if newDefinition isnt undefined
      definition = newDefinition
      observerList = []
      evaluate(observerList)
      observerTrigger() for observerTrigger in observerList
      return value

    # Read path
    # If no definition is given, we treat it as a read call and return the cached value
    # Simultaneously, check for calling signals/observers and register dependenceis accordingly
    # -------------------------------------------------------------------------
    # Life of a read
    #   check to see who is asking
    #   remove them from the list of targets to be notified
    #   register them as a dependent
    #   register self and their dependency
    #   return value
    else
      
      # check the global stack for the most recent dependent being evaluated
      # assume this is the caller and set it as a dependent
      dependent = dependencyStack[0]

      # If its a signal dependency - register it as such
      if dependent? and (dependent.dependencyType is "signal" or dependent.dependencyType is "event")

        # remove the dependent from the targets list if necessary
        # this is used to avoid duplicate redundant evaluation
        targetDependentIndex = evaluate.dependentTargets.indexOf dependent
        evaluate.dependentTargets.splice(targetDependentIndex, 1) if targetDependentIndex >= 0

        # register it as a dependent if necessary
        existingDependentIndex = evaluate.dependents.indexOf dependent
        evaluate.dependents.push dependent if existingDependentIndex < 0

        # symmetrically - register self as a dependency
        # this is needed for cleaning dependencies later
        existingDependencyIndex = dependent.dependencies.indexOf evaluate
        dependent.dependencies.push evaluate if existingDependencyIndex < 0

      # If it is a observer dependency - similarly register it as a observer
      else if dependent? and dependent.dependencyType is "observer"

        # register the observer if necessary
        existingObserverIndex = evaluate.observers.indexOf dependent
        evaluate.observers.push dependent if existingObserverIndex < 0

        # symmetrically - register self as a observee
        # this is needed for cleaning obeserver dependencies later
        existingObserveeIndex = dependent.observees.indexOf evaluate
        dependent.observees.push evaluate if existingObserveeIndex < 0

      return value

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
    dependencyStack.unshift trigger
    response() unless response is null
    dependencyStack.shift()

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


global.Event = (definition)->

  # Cached value of this signal calculated by the evaluate function
  # Recalculated when a definition has changed or when notified by a dependency
  value = null

  # evaluate is a function to calculates the signal value given the definition
  # it recursively revaluates any signals that depend on it as well
  # Simultaneously, in order to know what observers to notify later
  # it recursively passes through a list to collect all the observers of the updated signals
  # After the signal cascade has completed, the observers on the list are notified
  evaluate = (observerList)->

    # by default the value is the definition
    value = definition

    # if definition is a function then we need to evaluate it
    # and set it up to be notified when its dependencies change
    if typeof definition is "function"

      # clear old dependencies
      for dependency in evaluate.dependencies
        dependentIndex = dependency.dependents.indexOf evaluate
        dependency.dependents.splice dependentIndex, 1
      evaluate.dependencies = []

      # evaluate the definition and set new dependencies
      dependencyStack.unshift evaluate
      value = definition()
      dependencyStack.shift()

    # Add this signals own observers to the observer list
    # Note that observers is a list of observer triggers instead of the observers themselves
    for observerTrigger in evaluate.observers[...]
      observerList.push observerTrigger if (observerList.indexOf observerTrigger) < 0

    # A copy of the dependents to be evaluated
    # This is used to avoid redundant evaluation where a descendent has
    # already read from this value
    # Check to see if a dependent is still on this list before evaluating it
    # If a descendent reads from this signal at some point
    # it will remove itself from this list
    evaluate.dependentTargets = evaluate.dependents[...]

    # Recursively evaluate any dependents
    # Note that the dependents is a list of the dependents evaluate functions
    # not the signals themselves
    # and give them the observer list to add to as well
    # need to duplicate list since it will be modified by child evaluations
    for dependentEvaluate in evaluate.dependents[...]
      if evaluate.dependentTargets.indexOf(dependentEvaluate) >= 0
        dependentEvaluate(observerList)

  # List of signals that this depends on
  # Used to remove self from their dependents list when necessary
  # Note that while the dependents is a list of evaluate functions
  # dependencies is a list of the signals themselves
  evaluate.dependencies = []
  evaluate.dependencyType = "event"

  # Symmetrically - the list of other signals and observers that depend on this signal
  # Used to know who to notify when this signal has been updatedls
  evaluate.dependents = []
  evaluate.observers = []
  evaluate.dependentTargets = []

  # The actual signal function that is returned to the caller
  # Read by calling with no arguments
  # Write by calling with a new argument
  # Array methods if previously given an array as a definition
  # "set" convenience method if given an object/array as a definition
  createdEvent = (newDefinition)->

    # Write path
    # If a new definition is given, update the signal
    # recursively update any dependent signals
    # then finally trigger affected observers
    # -------------------------------------------------------------------------
    # Life of a write
    #   new definition is set
    #   delete/configure convenience methods
    #   execute new definition if necessary
    #   add observers to notify later
    #   make list of target dependents to be notified
    #   recursively evaluate dependents
    #     delete/configure convenience methods
    #     execute new definition
    #     get removed from target dependents list
    #     add observers to notify later
    #   notify observers
    if newDefinition isnt undefined
      definition = newDefinition
      observerList = []
      evaluate(observerList)
      observerTrigger() for observerTrigger in observerList
      value = null
      return value

    # Read path
    # If no definition is given, we treat it as a read call and return the cached value
    # Simultaneously, check for calling signals/observers and register dependenceis accordingly
    # -------------------------------------------------------------------------
    # Life of a read
    #   check to see who is asking
    #   remove them from the list of targets to be notified
    #   register them as a dependent
    #   register self and their dependency
    #   return value
    else
      
      # check the global stack for the most recent dependent being evaluated
      # assume this is the caller and set it as a dependent
      dependent = dependencyStack[0]

      # If its a signal dependency - register it as such
      if dependent? and (dependent.dependencyType is "signal" or dependent.dependencyType is "event")

        # remove the dependent from the targets list if necessary
        # this is used to avoid duplicate redundant evaluation
        targetDependentIndex = evaluate.dependentTargets.indexOf dependent
        evaluate.dependentTargets.splice(targetDependentIndex, 1) if targetDependentIndex >= 0

        # register it as a dependent if necessary
        existingDependentIndex = evaluate.dependents.indexOf dependent
        evaluate.dependents.push dependent if existingDependentIndex < 0

        # symmetrically - register self as a dependency
        # this is needed for cleaning dependencies later
        existingDependencyIndex = dependent.dependencies.indexOf evaluate
        dependent.dependencies.push evaluate if existingDependencyIndex < 0

      # If it is a observer dependency - similarly register it as a observer
      else if dependent? and dependent.dependencyType is "observer"

        # register the observer if necessary
        existingObserverIndex = evaluate.observers.indexOf dependent
        evaluate.observers.push dependent if existingObserverIndex < 0

        # symmetrically - register self as a observee
        # this is needed for cleaning obeserver dependencies later
        existingObserveeIndex = dependent.observees.indexOf evaluate
        dependent.observees.push evaluate if existingObserveeIndex < 0

      return value

  # run an initial evaluation on creation
  # no need to notify observers/dependents because it shouldnt have any yet
  evaluate()
  value = null
  return createdEvent