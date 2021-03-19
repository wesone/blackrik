
import { createTableBuilder } from '../../../src/adapters/readmodelstore-mysql/CreateTableBuilder';

const tableName = 'TestTable';

test('Build creat table statement', () => {
    const fieldDefinition = {
        id: {
            type: 'uuid',
            primaryKey: true,
        },
        test: {
            type: 'String',
            allowNull: true,
        },
        testDate: {
            type: 'Date',
        },
        testInt: {
            type: 'Integer',
            unique: true,
        },
        testInc: {
            type: 'Float',
            unique: true,
            autoIncrement: true,
        },
        testDefault: {
            type: 'String',
            defaultValue: 'Ein Test',
        },
        testShorthand: 'Timestamp',
    };
   
    const expectedSQL = 'CREATE TABLE `TestTable` (`id` CHAR(36) PRIMARY KEY, `test` VARCHAR(512) NULL, `testDate` DATETIME, `testInt` INTEGER UNIQUE, `testInc` FLOAT UNIQUE AUTO_INCREMENT, `testDefault` VARCHAR(512) DEFAULT \'Ein Test\', `testShorthand` TIMESTAMP) COMMENT="1:6f14f634622af59ae5328a0dd9db7d3fb49a7177cfc264d93f2cf5f14b1416a657c9075cbe896ce52e806900012f8910b44ec75ca621952720962fa02b2415c6"';
    const expectedHash = '1:6f14f634622af59ae5328a0dd9db7d3fb49a7177cfc264d93f2cf5f14b1416a657c9075cbe896ce52e806900012f8910b44ec75ca621952720962fa02b2415c6';
    const {sql, hash} = createTableBuilder(tableName, fieldDefinition);
    expect(sql).toEqual(expectedSQL);
    expect(hash).toEqual(expectedHash);
});
