
import { updateBuilder } from '../../../src/adapters/readmodelstore-mysql/UpdateBuilder';

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
