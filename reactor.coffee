# Constants
SIGNAL = "SIGNAL"
OBSERVER = "OBSERVER"

# In Node.js, Reactor is packaged into a module
# In the browser, Reactor is bound directly to the window namespace
global = exports ? this

# Global stack to automatically track dependencies
# - When a signal is updated, it first puts itself on the dependency stack
# - When a signal is read, it checks the top of the stack to see who is reading
# - The reader gets added as a dependent of the readee
# - The readee gets added as a dependency of the reader
# - When the signal evaluation is done, the signal pops itself off the stack
dependencyStack = []

# Signals are functions representing values
# - Read a signal by calling it with no arguments
# - Write to a signal by calling it with the desired value as an argument
# - Define a signal by calling it with a function as an argument
# - This set the value as the function's output instead of the function itself
#------------------------------------------------------------------------------
# If a signal reads other signals in it's definition, it is dependent on them
# - Signals automatically track what other signals they depend on
# - If any dependencies get updated, the dependent gets updated as well
#------------------------------------------------------------------------------
# Signals should NOT have any external effects
# - It should only read other values and return its own value
# - For external effects, use observers instead
#------------------------------------------------------------------------------
# To "destory" a signal, just set its definition to null
#------------------------------------------------------------------------------
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
    dependents: new PseudoSet() # Things which rely on this Signal
    dependencies: new PseudoSet() # Things this Signal relies on

    # Sets the signal's value based on the definition
    # Also establishes dependencies if necessary
    # - Clear previous dependencies
    # - Put self on stack, rerun definition, pop self off
    update: ->

      # clear old dependencies and errors
      @dependencies.forEach (dependency)=> dependency.dependents.delete this
      @dependencies.clear()

      # if definition is a function then execute it for the value
      @error = null
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
    # - register them as a dependent and register self as their dependency
    # - throw an error if signal value is invalid
    # - otherwise return value
    read: ->

      # check the global stack for the most recent dependent being updated
      # assume this is the caller and set it as a dependent
      # symmetrically register dependent/dependency relationship
      dependent = dependencyStack[dependencyStack.length - 1]
      if dependent?
        @dependents.add(dependent)
        dependent.dependencies.add(this)

      # If signal has an error then its value is invalid
      # Throw another error when read to notify any readers
      if @error
        signalError = new Error('Reading from corrupted Signal')
        throw signalError

      # If there are no problems, return the value like a normal variable would
      else return @value

    # Life of a write
    # - set the new definition
    # - configure convenience methods
    # - execute new definition if necessary and establish dependencies
    # - recursively update dependents while collecting observers
    # - notify observers
    write: (newDefinition)->
      @definition = newDefinition

      # Propagate changes
      dependencyQueue = [this] # Queue of dependent signals to update
      observerList = [] # Simultaneously collect dependent observers
      errorList = [] # Consolidate errors caused by the propagation

      # Breadth first propagation of the changes to dependents
      while dependencyQueue.length >= 1
        target = dependencyQueue.shift()

        # update the current signal
        # If an error occurs, collect it and keep propagating
        # A conslidated error will be thrown at the end of propagation
        try target.update()
        catch error then errorList.push error

        # Build the propagation queue
        target.dependents.forEach (dependent)->
          if dependent.dependencyType is SIGNAL
            dependencyQueue.push dependent unless dependent in dependencyQueue
          else if dependent.dependencyType is OBSERVER
            observerList.push dependent unless dependent in observerList

      # Once signal propagation has completed, then do observer propagation
      # This ensures that observers only see a consistent state of the signals
      for observer in observerList
        try observer.update()
        catch error then errorList.push error

      # If any errors occured during propagation then consolidate and throw them
      if errorList.length is 1 then throw errorList[0]
      else if errorList.length > 1
        errorMessage = errorList.length + " errors due to signal write"
        throw new CompoundError(errorMessage, errorList)

      # Return the written value on a write, just as a normal variable does
      return @value

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

# Observers represent definitions to signal changes
# They are defined in a manner similar to Signals
# The primary differences of observers are
# - they have no value to read
# - they cannot be observed themselves
# - they are notified only after signals have all been updated
# to remove an observer - just set its value to null
global.Observer = (definition)->

  observerCore =
    dependencyType: OBSERVER
    definition: null
    dependencies: new PseudoSet()

    # Activate the observer as well as reconfigure dependencies
    # The observer equivalent of update
    update: ->
      # clear old dependencies and errors
      @dependencies.forEach (dependency)=> dependency.dependents.delete this
      @dependencies.clear()

      # if definition is a function then execute it for the value
      if definition instanceof Function
        dependencyStack.push this
        try @definition()
        finally dependencyStack.pop()

    # configure the new definition and do
    write: (newdefinition)->
      @definition = newdefinition
      @update()


  # abstraction to hide the ugliness of how observers work
  observerInterface = (newdefinition)-> write(newdefinition)

  # Creation path - basically identical to the signal creation path
  observerCore.write(definition)
  return observerInterface


# Custom Error class to consolidate multiple errors together
class CompoundError extends Error
  global.CompoundError = CompoundError
  constructor: (message, errorArray)->

    # Build the message to display all the component errors
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

# Halfass implementation of Set until ECMAScript 6 gets adopted
class PseudoSet
  constructor: ->

    elements = []

    @add = (value)->
      elements.push value unless value in elements
      return this

    @clear = ->
      elements = []
      return

    @delete = (value)->
      valueIndex = elements.indexOf value
      if valueIndex >= 0
        elements.splice(valueIndex, 1)
        return true
      else
        return false

    @has =  (value)->
      return value in elements

    @forEach =  (callback)->
      callback(element) for element in elements
      return
