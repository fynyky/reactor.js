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
# Fix observers to work with signal core structure
# Add back in array and object setters and getters
# redo comments to read through it all
# Add back in propagation target filtering


# clear dependencies when new definition that is not a function is given
# Figure out if it is necessary to delete all dependencies for each evaluate. Is there a better way?
# Update array methods
# Investigate the necessity of the dependent targets list (or if there's a more efficient way of implementing it)
# Make signals read only (especially by default for the dependent signals)
# Memoery management
# Events
# Read-only arrays & objects if generated from a function signal
# Use nulls instead of splice when removing self from lists?
# remove redundant triggering when same value is made
# add in ability to get old values
# recompile with latest coffeescript compiler
# events
# multi commit batching
# avoid removing array and setter methods if user overrides them

# Constants
SIGNAL = "SIGNAL"
OBSERVER = "OBSERVER"
ARRAY_METHODS = ["pop", "push", "reverse", "shift", "sort", "splice", "unshift"]


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


  signalCore = 
    
    # Base properties of a signal
    definition: null
    value: null
    dependencies: []
    dependencyType: SIGNAL
    dependents: []
    observers: []

    # clear old dependencies both forward and back pointers
    # if definition is a function then we need to evaluate it
    evaluate: ->
      for dependency in @dependencies
        dependentIndex = dependency.dependents.indexOf(this)
        dependency.dependents[dependentIndex] = null
      @dependencies = []
      if @definition instanceof Function
        dependencyStack.push this
        @value = @definition()
        dependencyStack.pop()
      else @value = @definition

    propagate: (observerList)->
      for observer in @observers
        observerList.push(observer) if observerList.indexOf(observer) < 0
      for dependency in @dependents when dependency?
        dependency.evaluate()
        dependency.propagate(observerList)
      return observerList

    # check the global stack for the most recent dependent being evaluated
    # assume this is the caller and set it as a dependent
    # If its a signal dependency - register it as such
    # symmetrically register self as a dependency for cleaning dependencies later
    # If it is a observer dependency - similarly register it as a observer 
    # symmetrically register self as a observee for cleaning dependencies later
    read: ->
      dependent = dependencyStack[dependencyStack.length - 1]
      if dependent? and dependent.dependencyType is SIGNAL
        @dependents.push dependent if @dependents.indexOf(dependent) < 0
        dependent.dependencies.push this if dependent.dependencies.indexOf(this) < 0
      else if dependent? and dependent.dependencyType is OBSERVER
        @observers.push dependent if @observers.indexOf(dependent) < 0
        dependent.observees.push this if dependent.observees.indexOf(this) < 0
      return @value


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
    write: (newDefinition)->

      @definition = newDefinition
      @evaluate()

      if @definition instanceof Array then for methodName in ARRAY_METHODS
        do (methodName)=>
          signalInterface[methodName] = =>
            output = @definition[methodName].apply(@definition, arguments)
            observerList = @propagate([])
            observer.trigger() for observer in observerList
            return output
      else delete signalInterface[methodName] for methodName in ARRAY_METHODS
          
      if @definition instanceof Object
        signalInterface.set = (key, value)=>
          @definition[key] = value
          observerList = @propagate([])
          observer.trigger() for observer in observerList
          return @value
      else delete signalInterface.set

      observerList = @propagate([])
      observer.trigger() for observer in observerList
      return @value

  signalInterface = (newDefinition)->
    if newDefinition is undefined then signalCore.read()
    else signalCore.write(newDefinition)

  signalCore.write(definition)
  return signalInterface


# Observers represent responses to signal changes
# They are defined in a manner similar to Signals
# The primary differences of observers are
# - they have no value to read
# - they cannot be observed themselves
# - they are notified only after signals have all been updated
# to remove an observer - just set its value to null
global.Observer = (response)->

  observerCore = 
    response: null
    dependencyType: OBSERVER
    observees: []

    # Activate the observer as well as reconfigure dependencies
    # clear old observees
    # do initial trigger and set up to listen for future updates
    trigger: ->
      for observee in @observees
        observerIndex = observee.observers.indexOf this
        observee.observers[observerIndex] = null
      @observees = []
      if response instanceof Function
        dependencyStack.push this
        @response() 
        dependencyStack.pop()

    write: (newResponse)->
      @response = newResponse
      @trigger()

  observerInterface = (newResponse)-> write(newResponse)

  observerCore.write(response)
  return observerInterface