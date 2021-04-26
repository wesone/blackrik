# Introduction
Blackrik exposes an API to communicate with via HTTP.  
This API is used to send [commands](Aggregates#Commands) or [query data](ReadModels#Resolvers).

# Reference
Method| Path | Description
:--- | :--- | :---
POST |    [/commands](HTTP-API#Commands) | To execute commands via HTTP
GET |    [/query/:readModel/:resolver](HTTP-API#Query) | To query read models via HTTP

# Commands
Method| Path | Content-Type
:--- | :--- | :---
POST |    /commands |    application/json

### Body
The request body contains the command to execute as json.

Property | Type | Attribute | Description
:--- | :--- | :--- | :---
aggregateName | string | | The name of the aggregate
aggregateId | string | | The aggregateId to identify an aggregate instance<br>The client may generate a new aggregateId if the desired aggregate does not exist yet
type | string | | The name of the command to execute
payload | object | optional | An optional payload that contains options or arguments for the command

Example:
```sh
curl -X POST \
-H "Content-Type: application/json" \
-d "{\"aggregateName\": \"user\", \"aggregateId\": \"219de538-9936-4362-b29f-c5f57768f342\", \"type\": \"create\", \"payload\": {\"name\": \"John Doe\"}}" \
"http://localhost:3000/commands"
```

# Query
Method| Path 
:--- | :--- 
GET |    /query/[readModel](#readModel)/[resolver](#resolver)

### readModel
The name of the read model.

### resolver
The [resolver](ReadModels#Resolvers) of the read model.

Example:
```sh
curl -X GET\
"http://localhost:3000/query/user/get?id=219de538-9936-4362-b29f-c5f57768f342"
```

