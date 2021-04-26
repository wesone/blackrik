# Introduction
A saga can be a workflow.  
Workflows are able to depict complex or long-running business logic that has their own state. They react to events, perform transitions from one step to another and execute actions.

A workflow is a state machine whose [transitions](#Transitions) are caused by events. Whenever a workflow transitions, it is able to run actions. Conditions and loops can be created by defining multiple transitions with different target steps.

# Configuration
A saga that utilizes workflows needs to export an object with the following properties:

Property | Type | Attribute | Description
:--- | :--- | :--- | :---
name | string | | The name of the workflow. Must be unique
version | number | optional | A version number to differentiate between workflow changes that result in incompatible states
idHandler | function | optional | A function that gets the event and returns a [workflow identifier](#Workflow-identifier)
initial | string | | Name of the initial step
context | object | optional | Set an initial context to be used inside the [action callbacks](#action)
steps | object | | An object that contains [steps](#step)

Example:
```javascript
module.exports = {
    name: 'MyWorkflow',
    version: 1,
    idHandler: event => event.aggregateId,
    initial: 'init',
    context: {test: -1},
    steps: {
        init: {
            on: {
                'ANSWER_REQUESTED': 'generateAnswer'
            }
        },
        generateAnswer: {
            actions: [
                ({context}) => (context.test = 42)
            ],
            on: {
                'ANSWER_PROCESSED': 'done'
            }
        }
    }
};
```

## step
Property | Type | Attribute | Description
:--- | :--- | :--- | :---
actions | array | optional | Array of [action functions](#action) to be executed on step entry
on | object | optional | Define transitions from this step to another. Key/Value pairs with event type as key and the name of the target step (or `'done'`) as value
rollbackAction | function | optional | A [rollback function](#rollbackAction) to run compensation actions 

## action
`async [action](workflow: object)`  
The action function will be executed after a transition to the corresponding step. The function receives an object as the first parameter with the following properties:

Property | Type | Description
:--- | :--- | :---
context | object | The current workflow context. All changes to this object will be saved automatically
event | object | The event that triggered this transition
history | array | All processed events in ascending order
sideEffects | object | Gives access to all framework side effects such as [executeCommand](Blackrik#executeCommand) and [scheduleCommand](Blackrik#scheduleCommand)
store | object | The underlying store that is used to save the workflow state
trigger | function | Can be used to manually start a transition to another step. The function takes an event object that can be accessed from the history array or the event type as string (which may be a custom defined event). The transition will be executed after all actions are completed
rollback | function | Triggers a rollback. All rollback actions will be executed and the workflow transitions to the `done` state. This will happen immediately

## rollbackAction
`async [rollback](rollbackWorkflow: object)`  
The rollbackAction function will be executed if an action executes the rollback function (`workflow.rollback()`).  
The function receives an object as the first parameter that contains the same properties as the parameter of the [action function](#action) but without the properties `transition` and `rollback`.

# Workflow identifier
A workflow needs to be identified in order to load the correct state. For simple workflows that process only events from one aggregate it uses the `aggregateId` of the event by default. When different aggregates are involved, you need to find a common denominator and provide a custom `idHandler` function that receives the event and returns an id.

Example:
```javascript
event => {
    if(event.type === 'USER_CREATED')
        return event.aggregateId;
    return event.payload.userRef;
}
```

# Transitions
Each step in a workflow can define transitions. These transitions are triggered by events. You can also define custom events that are only processed inside the workflow to execute a transition without the need of an external event. The `done` event can be used to mark the workflow as finished. The next event will cause the creation of a new state and therefore the workflow will start at the initial state again.

# Rollback
For each step you can define a rollback action that can execute compensation actions such as cancelling an order or sending a command to notify the system of a failed business case. These rollback actions are executed in reverse order.

![image](https://user-images.githubusercontent.com/55196856/115556239-bf28d480-a2b0-11eb-968b-9bcd55ad4ff1.png)

# Example
In this example ([full source](https://github.com/wesone/blackrik/tree/master/examples/workflow)) we give the user the option to revert to the old email-address if it has changed.

![image](https://user-images.githubusercontent.com/55196856/115555769-30b45300-a2b0-11eb-842e-05979111cd63.png)

```javascript
const saveEmailAddress = workflow => {
    // save email address
};
const updateMail = workflow => {
    // update the email address
};
const sendConfirmationMail = workflow => {
    // send a confirmation email to the user
};
const restoreEmailAddress = workflow => {
    // execute a command to set the saved email address
};

module.exports = {
    name: 'UserEmailChange',
    version: 1,
    initial: 'init',
    context: {changeCount: 0},
    steps: {
        init: {
            on: {
                'USER_CREATED': 'newUser'
            }
        },
        newUser: {
            actions: [saveEmailAddress],
            on: {
                'USER_UPDATED': 'change',
                'USER_REJECTED': 'done',
            }
        },
        change: {
            actions: [updateMail, sendConfirmationMail],
            on: {
                'USER_UPDATED': 'change',
                'USER_MAIL_CHANGE_REVERTED': 'restore',
                'USER_REJECTED': 'done',
            }
        },
        restore: {
            actions: [restoreEmailAddress],
            on: {
                'USER_REJECTED': 'done',
                'USER_UPDATED': 'change',
            }
        }
    }
};
```
