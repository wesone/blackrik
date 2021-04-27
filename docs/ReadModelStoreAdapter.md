# Introduction
The read model store adapter is an interface to a persistence level.

# Reference
Visibility | Property
:---: | :---
public |     async [defineTable](ReadModelStoreAdapter#defineTable)(name: string, scheme: object, ?options: object): boolean<br>Defines a table and its structure
public |     async [dropTable](ReadModelStoreAdapter#dropTable)(name: string)<br>Deletes the specified table
public |     async [find](ReadModelStoreAdapter#find)(name: string, ?conditions: object, ?queryOptions: object): array<br>Loads entries from the store
public |     async [findOne](ReadModelStoreAdapter#findOne)(name: string, ?conditions: object, ?queryOptions: object): object \| null<br>Loads a single entry from the store
public |     async [count](ReadModelStoreAdapter#count)(name: string, ?conditions: object, ?queryOptions: object): number<br>Returns the amount of found entries
public |     async [insert](ReadModelStoreAdapter#insert)(name: string, data: object): boolean<br>Inserts a new entry into the table
public |     async [update](ReadModelStoreAdapter#update)(name: string, conditions: object, data: object): number<br>Updates entries in the table
public |     async [delete](ReadModelStoreAdapter#delete)(name: string, conditions: object): number<br>Deletes entries from the table

# defineTable
`async defineTable(name: string, scheme: object, ?options: object): boolean`  
Defines a table and its structure. It will remove and recreate existing tables if their scheme changed.

### Parameters
Name | Type | Attribute | Description
:--- | :--- | :--- | :---
name | string | | The name of the table to create.
scheme | object | | An object containing the fields and their configuration. See: [scheme](#scheme)
options | object | optional | Options to control the definition behavior. See: [options](#options)

### Return
`true` if the table was created which means that the table did not exist or the scheme was changed. Otherwise `false`.

### Examples
```javascript
await store.defineTable(tableName, {
    id: {
        type: 'uuid',
        primaryKey: true
    },
    test: {
        type: 'string',
    },
    test2: 'number'
});
```

## scheme
Each key is the name of a field with a value that is either the data type of the field (as string) or an object describing the field:

Property | Type | Attribute | Description
:--- | :--- | :--- | :---
type | string | | The field's data type. Can be one of the following:<br>`boolean` true or false<br>`date` Dates like JavaScript Date objects<br>`json` Objects that can be JSON serialized<br>`number` Positive or negative float or integer<br>`string` Strings with a max length of 512 characters<br>`text` Strings of indefinite length<br>`uuid` Strings with 36 characters
primaryKey | boolean | optional | Sets the field as Primary key
unique | boolean | optional | Sets the field to be unique across all entries

## options
Property | Type | Attribute | Description
:--- | :--- | :--- | :---
| | | | 

# dropTable
`async dropTable(name: string)`  
Deletes the table with the name `name`.

# find
`async find(name: string, ?conditions: object, ?queryOptions: object): array`  
Loads entries from the store.

### Parameters
Name | Type | Attribute | Description
:--- | :--- | :--- | :---
name | string | | The name of the table
conditions | object | optional | An object with conditions to describe the query. See: [conditions](#conditions)
queryOptions | object | optional | Additional options that affect the query. See: [queryOptions](#queryOptions)

### Return
`array` of objects

### Examples
```javascript
await store.find('Users',
    {
        createdAt: {
            $and: {
                $gt: '2021-12-17 02:24:00',
                $lte: '2021-12-31 23:59:59',
            } 
        }
    },
    {
        fields: ['userId', 'createdAt', 'name'],
        sort: [
            ['createdAt', 'asc']
        ],
        limit: 10,
        offset: 100
    }
);
await store.find('Users', {
    $or: [
        {name: {$like: 'J%'}, createdAt: {$lte: '2021-12-17 02:24:00'}},
        {name: {$like: 'H%'}, createdAt: {$gt: '2021-12-17 02:24:00'}}
    ]
});
```

## conditions
A condition can have the following forms:
- `{fieldName: value}`
- `{fieldName: {operator}}`
- `{logicalOperator: [operators]}`

List of operators:

Operator | Type | Description
:--- | :--- | :--- 
$eq | Comparison | a == b
$ne  | Comparison | a != b
$gt | Comparison | a > b
$gte | Comparison | a >= b
$lt | Comparison | a < b
$lte | Comparison | a <= b
$is | Comparison | a IS b
$isNot | Comparison | a IS NOT b
$like | Comparison | a LIKE b
$in | Comparison | a IN [b,c,d]
$and | Logic | a AND b
$or | Logic | a OR b
$not | Logic | !(a AND b)
$nor | Logic | !(a OR b)

## queryOptions
Property | Type | Attribute | Description
:--- | :--- | :--- | :---
fields | array | optional | An array of fields to be returned. Without `fields`, all fields will be part of the result
sort | array | optional | An array where each entry is an array of the form `['fieldName', 'ASC' \| 'DESC']`
limit | number | optional | Limit the result to number
offset | number | optional | Offset the result to number


# findOne
`async findOne(name: string, ?conditions: object, ?queryOptions: object): object | null`  
Same as [find](#find) but the result will be the first found entry. Uses `limit: 1` inside queryOptions.

### Return
`object` | `null`

# count
`async count(name: string, ?conditions: object, ?queryOptions: object): number`  
Works like [find](#find) but returns the amount of found entries.

### Return
The amount of found entries

# insert
`async insert(name: string, data: object): boolean`  
Inserts a new entry into the table.

### Parameters
Name | Type | Attribute | Description
:--- | :--- | :--- | :---
name | string | | The name of the table.
data | object | | An object containing the values to insert (`fieldName: value`)

### Return
`true` if the entry was successfully inserted. Otherwise `false`.

# update
`async update(name: string, conditions: object, data: object): number`  
Updates entries in the table.

### Parameters
Name | Type | Attribute | Description
:--- | :--- | :--- | :---
name | string | | The name of the table.
conditions | object | | An object with conditions to specify the affected entries. See: [conditions](#conditions)
data | object | | An object containing the values to update (`fieldName: value`)

### Return
The amount of affected entries.

# delete
`async delete(name: string, conditions: object): number`  
Deletes entries from the table.

### Parameters
Name | Type | Attribute | Description
:--- | :--- | :--- | :---
name | string | | The name of the table.
conditions | object | | An object with conditions to specify the affected entries. See: [conditions](#conditions)

### Return
The amount of affected entries.

# beginTransaction()

# commit()

# rollback()
