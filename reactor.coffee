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
# hide dependents & observers variables
# reduce redundant evaluation using tokens
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
            createdSignal(definition) # Manually trigger the refresh
            return output
        else
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
      dependencyStack.push evaluate
      value = definition()
      dependencyStack.pop()

    # Add this signals own observers to the observer list
    # Note that observers is a list of observer triggers instead of the observers themselves
    for observerTrigger in evaluate.observers[...]
      observerList.push observerTrigger if (observerList.indexOf observerTrigger) < 0

    # TODO push evaluate tokens to observers here

    # Recursively evaluate any dependents
    # Note that the dependents is a list of the dependents evaluate functions
    # not the signals themselves
    # and give them the observer list to add to as well
    # need to duplicate list since it will be modified by child evaluations
    for dependentEvaluate in evaluate.dependents[...]
      # TODO check for token before evaluating here
      dependentEvaluate(observerList)

  # List of signals that this depends on
  # Used to remove self from their dependents list when necessary
  # Note that while the dependents is a list of evaluate functions
  # dependencies is a list of the signals themselves
  evaluate.dependencies = []
  evaluate.dependencyType = "signal"

  # Symmetrically - the list of other signals and observers that depend on this signal
  # Used to know who to notify when this signal has been updated
  evaluate.dependents = []
  evaluate.observers = []

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

        # TODO remove evaluate token

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