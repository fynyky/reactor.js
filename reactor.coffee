# Reactor is a javascript library for reactive programming
# It comprises of 2 primary components: Signals and Observers

# Signals represent values which can be observed
# A signal's value can either be set directly or defined in terms of other signals

# Observers represent reactions to changes in signals
# An observer can observe multiple signals and will trigger when any of them changes

# Together, signals and observers form a directed acyclic graph
# Signals form the root and intermediate nodes of the graph
# Observers form the leaf nodes in the graph

# When a signal is updated, it propagates its changes through the graph updating other signals
# After all dependent signals have been updated the relevant observers will be triggered
# From the perspective of observers, all signals are updated atomically and instantly

# In Reactor, observer and signal dependencies are set automatically and dynamically
# Reactor detects when a signal is being used at run time, and automatically establishes the link
# This means there is no need to explicitly declare dependencies
# And dependencies can be changed across the execution of the program

# Constants
SIGNAL = "SIGNAL"
OBSERVER = "OBSERVER"
ARRAY_METHODS = ["pop", "push", "reverse", "shift", "sort", "splice", "unshift"]

# In node.js, Reactor is packaged into the exports obgject as a module import
# In the browser, Reactor is bound directly to the window namespace
global = exports ? this

# Global stack to automatically track signal dependencies
# Whenever a signal or observer is evaluated - it puts itself on the dependency stack
# When another signals is read - the dependency stack is checked to see who is asking
# The reader gets added as a dependent to the signal being read
# wWen a signal or observer's evaluation is done - it pops itself off the stack
dependencyStack = []

# Custom Error classes
# Errors can occur in the user defined evaluation functions
# When an error occurs do 3 things
# 1) Set self in error
# 2) propagate the error forward
# 3) catch any remaining errors
# class LinkedError extends Error
#   constructor: (message, cause)->
#     # Prepare the description to include the cause
#     @cause = cause
#     causeDescription = @cause.stack ? @cause.toString()
#     compoundMessage = message + '\nCause: ' + causeDescription
#     # Initialize it as a normal error with a different name
#     proxyError = Error.call(this, compoundMessage)
#     proxyError.name = "LinkedError"
#     errorProperties = Object.getOwnPropertyNames(proxyError)
#     for property in errorProperties when proxyError.hasOwnProperty(property)
#       this[property] = proxyError[property]
#     return this

class CompoundError extends Error
  constructor: (message, errorArray)->
    # Prepare the description to include the cause
    @errors = errorArray
    for error in @errors
      errorDescription = error.stack ? error.toString()
      message = message + '\n' + errorDescription

    # Initialize it as a normal error with a different name
    proxyError = Error.call(this, message)
    proxyError.name = "CompoundError"
    errorProperties = Object.getOwnPropertyNames(proxyError)
    for property in errorProperties when proxyError.hasOwnProperty(property)
      this[property] = proxyError[property]
    return this

global.CompoundError = CompoundError

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
global.Signal = (definition)->

  # The actual "guts" of a signal containing properties and methods
  signalCore =

    # Initial base properly of the signal
    definition: null
    value: null
    dependencies: []
    dependencyType: SIGNAL
    dependents: []
    observers: []
    readers: []
    error: null

    # Sets the signals value based on the definition
    # While establishing its dependencies
    evaluate: (observerList, errorList)->
      # clear old dependencies both forward and back pointers
      for dependency in @dependencies
        dependentIndex = dependency.dependents.indexOf(this)
        dependency.dependents[dependentIndex] = null
      @dependencies = []
      @error = null # clear old errors as well
      # if definition is a function then execute it for the value
      if @definition instanceof Function
        dependencyStack.push this
        try @value = @definition()
        catch error
          @error = error
          errorList.push error
        finally dependencyStack.pop()
      else @value = @definition
      # since a new value is set clear the list of people who
      @readers = []
      # Notifies dependent signals of the change
      # While simultaneously collecting list of affected observers
      # Adds its own observers to the list
      # Then recursively updates its dependents
      # The final observer list is return to the caller to trigger
      for observer in @observers when observer?
        observerList.push(observer) if observer not in observerList
      # Need to make a copy of the list since the child evalutaes reach back and modify the dependent list
      for dependency in @dependents[...] when dependency? and dependency not in @readers
        dependency.evaluate(observerList, errorList)
      return observerList

    # Life of a read
    #   check to see who is asking
    #   register them as a dependent
    #   register self and their dependency
    #   return value
    read: ->
      # check the global stack for the most recent dependent being evaluated
      # assume this is the caller and set it as a dependent
      dependent = dependencyStack[dependencyStack.length - 1]
      # Register that they have read the current form and do not need to be notified
      @readers.push(dependent) if dependent? and dependent not in @readers
      # If its a signal or observer dependency register it accordingly
      # symmetrically register itself as a dependency for cleaning dependencies later
      if dependent? and dependent.dependencyType is SIGNAL
        @dependents.push dependent if dependent not in @dependents
        dependent.dependencies.push this if this not in dependent.dependencies
      else if dependent? and dependent.dependencyType is OBSERVER
        @observers.push dependent if dependent not in @observers
        dependent.observees.push this if this not in dependent.observees
      if @error
        signalError = new Error('Reading from corrupted Signal', @error)
        throw signalError
      else return @value

    # Life of a write
    #   new definition is set
    #   execute new definition if necessary and establish dependencies
    #   delete/configure convenience methods
    #   recursively evaluate dependents while collecting observers
    #   notify observers
    write: (newDefinition)->
      @definition = newDefinition
      # Set the special array methods if the definition is an array or an object
      # Essentially providing convenience mutator methods which automatically trigger revaluation
      if @definition instanceof Array then for methodName in ARRAY_METHODS
        do (methodName)=>
          signalInterface[methodName] = =>
            output = @definition[methodName].apply(@definition, arguments)
            @write(@definition)
            return output
      else delete signalInterface[methodName] for methodName in ARRAY_METHODS
      if @definition instanceof Object
        signalInterface.set = (key, value)=>
          @definition[key] = value
          @write(@definition)
      else delete signalInterface.set
      # Propagate the changes and collect back the observers and errors
      observerList = []
      errorList = []
      @evaluate(observerList, errorList)
      for observer in observerList[...] # Copy the list since the trigger might modify it
        try observer.trigger()
        catch error then errorList.push error
      # Report the total errors caused as a single compound error
      if errorList.length is 1 then throw errorList[0]
      else if errorList.length > 1
        throw new CompoundError( errorList.length + " errors due to signal write", errorList)
      return @value

  # The interface function returned to the user to utilize the signal
  # This is done to abstract away the messiness of how the signals work
  signalInterface = (newDefinition)->
    # An empty call is treated as a read
    if arguments.length is 0 then signalCore.read()
    # A non empty call is treated as a write
    else signalCore.write(newDefinition)

  # Creation path - basically just initializing with the first definition
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
    # The observer equivalent of evaluate
    trigger: ->
    # clear old observees
      for observee in @observees
        observerIndex = observee.observers.indexOf this
        observee.observers[observerIndex] = null
      @observees = []
      # do initial trigger and establish dependencies
      if response instanceof Function
        dependencyStack.push this
        try @response()
        finally dependencyStack.pop()

    # configure the new response and do
    write: (newResponse)->
      @response = newResponse
      @trigger()

  # abstraction to hide the ugliness of how observers work
  observerInterface = (newResponse)-> write(newResponse)

  # Creation path - basically identical to the signal creation path
  observerCore.write(response)
  return observerInterface
