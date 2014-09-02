# Constants
SIGNAL = "SIGNAL"
OBSERVER = "OBSERVER"

# In Node.js, Reactor is packaged into a module
# In the browser, Reactor is bound directly to the window namespace
global = exports ? this

# Global stack to automatically track dependencies
# - When a signal is evaluated, it first puts itself on the dependency stack
# - When a signal is read, it checks the top of the stack to see who is reading
# - The reader gets added as a dependent of the readee
# - The readee gets added as a dependency of the reader
# - When the signal evaluation is done, the signal pops itself off the stack
dependencyStack = []

# Signals are functions representing values
# - Read a signal by calling it with no arguments
# - Write to a signal by calling it with the desired value as an argument
# - Define a signal by calling it with a function as an argument
# - This means the value is the function's output instead of the function itself
#-------------------------------------------------------------------------------
# If a signal reads other signals in it's definition, it is dependent on them
# - Signals automatically track what other signals they depend on
# - If any dependencies get updated, the dependent gets updated as well
#-------------------------------------------------------------------------------
# Signals should NOT have any external effects
# - It should only read other values and return its own value
# - For external effects, use observers instead
#-------------------------------------------------------------------------------
# To "destory" a signal, just set its definition to null
#-------------------------------------------------------------------------------
# Signals are made up of 2 main parts
# - The core: The properties & methods which lets signals work
# - The interface: The function returned to the user to use
global.Signal = (definition)->

  # The "guts" of a signal containing properties and methods
  # All actual functionality & state should be built into the core
  # Should be completely agnostic to syntactic sugar
  signalCore =

    # Properties tracking the state of the signal
    dependencyType: SIGNAL
    definition: null
    value: null
    error: null
    dependencies: [] # Signals which this uses in its definition
    dependents: [] # Signals which use this in their definitions
    observers: [] # Observers which use this in their triggers
    bindings: []

    # Sets the signal's value based on the definition
    # Also establishes dependencies if necessary
    evaluate: ->

      # clear old dependencies and errors
      for dependency in @dependencies
        dependentIndex = dependency.dependents.indexOf(this)
        dependency.dependents[dependentIndex] = null
      @dependencies = []
      @error = null

      # if definition is a function then execute it for the value
      if @definition instanceof Function
        dependencyStack.push this
        try @value = @definition()
        catch error
          @error = error
          throw error
        finally dependencyStack.pop()

      # For non-functions the value is just definition
      else @value = @definition

    # Life of a read
    # - check to see who is asking
    # - register them as a dependent
    # - register self and their dependency
    # - return value
    read: ->

      # check the global stack for the most recent dependent being evaluated
      # assume this is the caller and set it as a dependent
      dependent = dependencyStack[dependencyStack.length - 1]

      # If its a signal or observer dependency register it accordingly
      # symmetrically register itself as a dependency for clearing later
      if dependent? and dependent.dependencyType is SIGNAL
        @dependents.push dependent if dependent not in @dependents
        dependent.dependencies.push this if this not in dependent.dependencies

      else if dependent? and dependent.dependencyType is OBSERVER
        @observers.push dependent if dependent not in @observers
        dependent.observees.push this if this not in dependent.observees

      # If the signal has an error then reading from causes another error
      if @error
        signalError = new Error('Reading from corrupted Signal', @error)
        throw signalError

      else return @value

    # Life of a write
    # - set the new definition
    # - configure convenience methods
    # - execute new definition if necessary and establish dependencies
    # - recursively evaluate dependents while collecting observers
    # - notify observers
    write: (newDefinition)->

      @definition = newDefinition

      # Propagate changes
      dependencyQueue = [this] # Queue of dependent signals to update
      observerList = [] # Simultaneously collect dependent observers
      bindingList = []
      errorList = [] # Consolidate errors caused by the propagation

      # Breadth first propagation of the changes to dependents
      while dependencyQueue.length >= 1
        target = dependencyQueue.shift()
        if target?

          # Evaluate the current signal
          # If an error occurs, collect it and keep propagating
          # A conslidated error will be thrown at the end of propagation
          try target.evaluate()
          catch error then errorList.push error

          # Build the propagation queue
          for dependent in target.dependents when dependent?
            dependencyQueue.push dependent unless dependent in dependencyQueue

          # Collect the observer list
          for observer in target.observers when observer?
            observerList.push observer unless observer in observerList

          # Collect the bindings
          for binding in target.bindings when binding?
            bindingList.push binding unless binding in bindingList

      # Once signal propagation has completed, then do observer propagation
      # This ensures that observers only see a consistent state of the signals
      for observer in observerList
        try observer.trigger()
        catch error then errorList.push error

      for binding in bindingList
        try binding()
        catch error then errorList.push error

      # If any errors occured during propagation then consolidate and throw them
      if errorList.length is 1 then throw errorList[0]
      else if errorList.length > 1
        errorMessage = errorList.length + " errors due to signal write"
        throw new CompoundError(errorMessage, errorList)

      # Return the written value on a write, just as a normal variable does
      return @value

    bind: (bindee)->
      bindings.push bindee unless bindee in bindings

  # The interface function returned to the user to utilize the signal
  # This is done to abstract away the messiness of how the signals work
  # Should contain no additional functionality and be purely syntactic sugar
  signalInterface = (newDefinition)->

    # An empty call is treated as a read
    if arguments.length is 0 then signalCore.read()

    # A non empty call is treated as a write
    else

      # Set convenience methods
      if newDefinition instanceof Object
        signalInterface.set = (key, value)->
          output = newDefinition[key] = value
          signalCore.write(newDefinition)
          return output
      else
        delete signalInterface.set

      if newDefinition instanceof Array
        signalInterface.push = ->
          output = newDefinition.push.apply(newDefinition, arguments)
          signalCore.write(newDefinition)
          return output
        signalInterface.pop = ->
          output = newDefinition.pop.apply(newDefinition, arguments)
          signalCore.write(newDefinition)
          return output
        signalInterface.shift = ->
          output = newDefinition.shift.apply(newDefinition, arguments)
          signalCore.write(newDefinition)
          return output
        signalInterface.unshift = ->
          output = newDefinition.unshift.apply(newDefinition, arguments)
          signalCore.write(newDefinition)
          return output
        signalInterface.reverse = ->
          output = newDefinition.reverse.apply(newDefinition, arguments)
          signalCore.write(newDefinition)
          return output
        signalInterface.sort = ->
          output = newDefinition.sort.apply(newDefinition, arguments)
          signalCore.write(newDefinition)
          return output
        signalInterface.splice = ->
          output = newDefinition.splice.apply(newDefinition, arguments)
          signalCore.write(newDefinition)
          return output
      else
        delete signalInterface.push
        delete signalInterface.pop
        delete signalInterface.shift
        delete signalInterface.unshift
        delete signalInterface.reverse
        delete signalInterface.sort
        delete signalInterface.splice

      # Once convenience methods are set on the interface
      signalCore.write(newDefinition)

  # Initialize with the full write path and return the interface
  signalInterface(definition)
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
    dependencyType: OBSERVER
    response: null
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


# Custom Error class to consolidate multiple errors together
class CompoundError extends Error
  constructor: (message, errorArray)->
    @errors = errorArray
    for error in @errors
      errorDescription = error.stack ? error.toString()
      message = message + '\n' + errorDescription

    # Initialize it as a normal error with a different name
    # stack property is dynamically generated on read
    # so name needs to be set first before properties are copied
    proxyError = Error.call(this, message)
    proxyError.name = "CompoundError"
    errorProperties = Object.getOwnPropertyNames(proxyError)
    for property in errorProperties when proxyError.hasOwnProperty(property)
      this[property] = proxyError[property]

    return this

global.CompoundError = CompoundError
