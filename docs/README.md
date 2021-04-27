# Blackrik Documentation

## Introduction

### Event-Sourcing
Just store every state change of the system instead of the current state.
A change in the state is called event.

### CQRS
Divide the system into two parts:
* Write - handles the input of the client and produces events
* Read - Uses the events to build up the current state and handles queries of the client

## Core concepts
There are 3 major parts inside a Blackrik application.

### [Aggregates](Aggregates)
An aggregate represents a state of a single unit inside your system (e.g. user).  
It receives [commands](Aggregates#Commands) that request changes to the units state (e.g. update user).  
A command can emit an event to tell the system that a state change happened (e.g. user was updated).  
It also has a [projection](Aggregates#Projection) that uses all events that belong to the unit, to build the current state to be used inside the commands.

### [ReadModels](ReadModels)
A read model will listen to events of an aggregate and will also efficiently build a [projection](ReadModels#Projection) of the current state.  
It also has [resolvers](ReadModels#Resolvers) that will use the read model's projection to perform queries (e.g. what is the user's address).

### [Sagas](Sagas)
Just like read models, sagas will listen to events of an aggregate and execute [business logic](Sagas#Handlers).  
They are also called process managers.  
A saga may execute so called "[side effects](Sagas#SideEffects)" such as executing or scheduling other commands, calling external web-services or sending emails.