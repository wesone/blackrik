
import { insertIntoBuilder } from '../../../src/adapters/readmodelstore-mysql/InsertIntoBuilder';

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
        '2021-12-17T02:24:00.000Z',
        42,
        null,
        null,
    ];
    const {sql, parameters} = insertIntoBuilder(tableName, data);
    expect(sql).toEqual(expectedSQL);
    expect(parameters).toEqual(expectedParameters);
});
