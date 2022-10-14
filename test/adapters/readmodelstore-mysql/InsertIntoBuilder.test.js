
import {insertIntoBuilder} from '../../../src/adapters/readmodelstore-mysql/InsertIntoBuilder';

const tableName = 'TestTable';

test('create insert into statement', () => {
    const data = {
        test: 'Hello world',
        testDate: new Date('December 17, 2021 03:24:00'),
        testInt: 42,
        testNull: null,
        testUndefined: undefined,
    };
   
    const expectedSQL = 'INSERT INTO `TestTable` (`test`, `testDate`, `testInt`, `testNull`, `testUndefined`) VALUES (?, ?, ?, ?, ?)';
    const expectedParameters = [
        'Hello world',
        '2021-12-17 02:24:00',
        '42',
        null,
        null,
    ];
    const {sql, parameters} = insertIntoBuilder(tableName, data);
    expect(sql).toEqual(expectedSQL);
    expect(parameters).toEqual(expectedParameters);
});

test('create insert into statement with position check', () => {
    const data = {
        test: 'Hello world',
        testDate: new Date('December 17, 2021 03:24:00'),
        testInt: 42,
        testNull: null,
        testUndefined: undefined,
    };
   
    const expectedSQL = 'INSERT INTO `TestTable` (`test`, `testDate`, `testInt`, `testNull`, `testUndefined`, `_lastPosition`, `_operation`) SELECT ?, ?, ?, ?, ?, ?, ? WHERE ? > COALESCE(( SELECT MAX( `_lastPosition` ) FROM `TestTable` ),-1) OR EXISTS ( SELECT MAX( `_operation` ) AS `_maxOp` , `_lastPosition` FROM `TestTable` GROUP BY `_lastPosition` HAVING `_lastPosition` = ? AND ? > `_maxOp` )';
    const expectedParameters = [
        'Hello world',
        '2021-12-17 02:24:00',
        '42',
        null,
        null,
        '4',
        '2',
        '4',
        '4',
        '2'
    ];
    const {sql, parameters} = insertIntoBuilder(tableName, data, {position: 4, operation: 2});
    expect(sql).toEqual(expectedSQL);
    expect(parameters).toEqual(expectedParameters);
});
