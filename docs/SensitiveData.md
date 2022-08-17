# Handling the General Data Protection Regulation (GDPR)
To comply with the *General Data Protection Regulation (GDPR)* it is mandatory to handle sensitive data securely and prevent unauthorized access.  
It is also a requirement to delete personal data (data that can be used to reveal a person's identity) if requested.

One way to handle this deletion can be anonymization. For example one could replace a person's full name with **John Doe**.
But how can we handle this in a world with an append-only event store?

Updating the name to **John Doe** would just lead to a new event. However the old event with the original name still exists inside the event store.
A few solutions to this problem already exist out there and all of them can be implemented with Blackrik.

## Referencing
We keep personal data out of our events and just store references to another system that holds the actual information.  
If an event needs to contain personal data, we would write that data into the other system and just write a reference into the event.  
A read model would then use that reference to get the personal data from the other system and maintain it's own database.  

If a deletion is requested, we can delete the personal data from the other system without affecting our events in any way.  
Our application just needs to handle the case that a reference from an event does not exist anymore inside the other system.  
And we would also need a mechanism to erase the personal data from the read model store.

## Crypto-shredding
All personal data will be encrypted before it gets written into an event.  
We would need at least one private key for each aggregate id and we would build a key management system to keep track of all the keys (which aggregate id has which private key).  
A read model would then decrypt the data from an event with the help of the key management system to maintain it's own database.  

If a deletion is required, we can simply delete the affected private key(s) from the key management system without affecting our events in any way.  
This means we would not delete the data but just prevent access to it. Using this method requires us to use a strong encryption algorithm to make sure it is "impossible" to decrypt the data without the key. However keep in mind that a strong encryption algorithm today may be a weak one in a few years.  
We would also need a mechanism to erase the personal data from the read model store.

## Deleting
You may have learned that individual events are generally considered immutable. The event store after all is an append-only database. Manipulating or deleting events is something you should not do because an event reflects something that happened and the past cannot be changed.  

But what if we delete all events of a specific aggregate id?  
As an aggregate is an encapsuled unit, deleting that unit would not affect any other aggregates.  
So deleting whole aggregates from the event store and pretending that they never existed should not lead to problems.  
The advantage is that there is not much overhead. You wouldn't need additional systems or databases.  

With Blackrik you can return an event with the type [`TOMBSTONE` from a command](Aggregates#tombstone-event) or you can call [deleteAggregate](Blackrik#deleteAggregate) from an API handler or as [side effect](Sagas#sideeffects) inside a saga.
This will erase all affected events from the event store and the read model projection can listen to the Tombstone event to clear it's database accordingly.
