
import { selectBuilder } from '../../../src/adapters/readmodelstore-mysql/SelectBuilder';

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
        sort: {
            a: -1,
        }
    };
   
    const expectedSQL = 'SELECT DISTINCT `a`, `b`, `c` FROM `TestTable` WHERE `id` = ? GROUP BY `a` ORDER BY `a` DESC LIMIT ? OFFSET ?';
    const expectedParameters = [
        1,
        10,
        5
    ];
    const {sql, parameters} = selectBuilder(tableName, queryOptions);
    expect(sql).toEqual(expectedSQL);
    expect(parameters).toEqual(expectedParameters);
});
