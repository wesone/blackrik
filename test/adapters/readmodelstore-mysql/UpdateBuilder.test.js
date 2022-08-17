
import {updateBuilder} from '../../../src/adapters/readmodelstore-mysql/UpdateBuilder';

const tableName = 'TestTable';

test('create update statement', () => {
    const data = {
        test: 'Hello world',
        testDate: new Date('December 17, 2021 03:24:00'),
        testInt: 42,
        testNull: null,
        testUndefined: undefined,
    };

    const conditions = {
        id: 1,
    };
   
    const expectedSQL = 'UPDATE `TestTable` SET `test` = ?, `testDate` = ?, `testInt` = ?, `testNull` = ?, `testUndefined` = ? WHERE `id` = ?';
    const expectedParameters = [
        'Hello world',
        '2021-12-17 02:24:00',
        '42',
        null,
        null,
        '1',
    ];
    const {sql, parameters} = updateBuilder(tableName, data, conditions);
    expect(sql).toEqual(expectedSQL);
    expect(parameters).toEqual(expectedParameters);
});

test('with no conditions', () => {
    const data = {
        test: 'Hello world'
    };
    const expectedSQL = 'UPDATE `TestTable` SET `test` = ?';
    const expectedParameters = [
        'Hello world',
    ];
    const {sql, parameters} = updateBuilder(tableName, data, null);
    expect(sql).toEqual(expectedSQL);
    expect(parameters).toEqual(expectedParameters);
});

test('with position but no conditions', () => {
    const data = {
        test: 'Hello world'
    };
    const expectedSQL = 'UPDATE `TestTable` SET `test` = ?, `_lastPosition` = ?, `_operation` = ? WHERE (COALESCE(( SELECT * FROM ( SELECT MAX( `_lastPosition` ) FROM `TestTable` ) AS _maxPosition ), -1) < ? OR EXISTS ( SELECT `_maxOp` FROM ( SELECT MAX( `_operation` ) AS `_maxOp` , `_lastPosition` FROM `TestTable` GROUP BY `_lastPosition` HAVING `_lastPosition` = ? AND ? > `_maxOp` ) AS _maxOp ))';
    const expectedParameters = [
        'Hello world',
        '1',
        '2',
        '1',
        '1',
        '2'
    ];
    const {sql, parameters} = updateBuilder(tableName, data, null, {position: 1, operation: 2});
    expect(sql).toEqual(expectedSQL);
    expect(parameters).toEqual(expectedParameters);
});
