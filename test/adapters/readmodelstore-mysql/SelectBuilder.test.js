
import {selectBuilder} from '../../../src/adapters/readmodelstore-mysql/SelectBuilder';

const tableName = 'TestTable';

test('create select statement', () => {
    
    const queryOptions = {
        conditions: {
            id: 1,
        },
        fields: ['a', 'b', 'c'],
        limit: 10,
        offset: 5,
        group: ['a'],
        distinct: true,
        sort: [
            ['a', -1]
        ]
    };
   
    const expectedSQL = 'SELECT DISTINCT `a`, `b`, `c` FROM `TestTable` WHERE `id` = ? GROUP BY `a` ORDER BY `a` DESC LIMIT ? OFFSET ?';
    const expectedParameters = [
        '1',
        '10',
        '5'
    ];
    const {sql, parameters} = selectBuilder(tableName, queryOptions);
    expect(sql).toEqual(expectedSQL);
    expect(parameters).toEqual(expectedParameters);
});


test('sort queryOption', () => {
    
    const queryOptions = {
        sort: [
            {a: -1},
            ['b', 1],
            ['c', 'ASC'],
            ['d', 'DESC'],
        ]
    };
   
    const expectedSQL = 'SELECT * FROM `TestTable` ORDER BY `a` DESC, `b` ASC, `c` ASC, `d` DESC';
    const expectedParameters = [];
    const {sql, parameters} = selectBuilder(tableName, queryOptions);
    expect(sql).toEqual(expectedSQL);
    expect(parameters).toEqual(expectedParameters);
});

test('dates', () => {
    const queryOptions = {
        conditions: {
            $or: [
                {name: {$like: 'J%'}, createdAt: {$lte: '2021-12-17 02:24:00'}},
                {name: {$like: 'H%'}, createdAt: {$gt: '2021-12-17 02:24:00'}}
            ]
        }
        
    };
   
    const expectedSQL = 'SELECT * FROM `TestTable` WHERE ((`name` LIKE ? AND `createdAt` <= ?) OR (`name` LIKE ? AND `createdAt` > ?))';
    const expectedParameters = ['J%', '2021-12-17 02:24:00', 'H%', '2021-12-17 02:24:00'];
    const {sql, parameters} = selectBuilder(tableName, queryOptions);
    expect(sql).toEqual(expectedSQL);
    expect(parameters).toEqual(expectedParameters);
});
