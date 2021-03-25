
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
   
    const expectedSQL = 'CREATE TABLE `TestTable` (`id` CHAR(36) PRIMARY KEY, `test` VARCHAR(512) NULL, `testDate` DATETIME, `testInt` DOUBLE UNIQUE, `testInc` DOUBLE UNIQUE AUTO_INCREMENT, `testDefault` VARCHAR(512) DEFAULT \'Ein Test\', `testShorthand` TIMESTAMP) COMMENT="1:88006f3b3abcdef52e8ce75a41c96eec2ff5b35c691469b55ddbed4dbed1e64baa6ac006f3fbca55151cc311991d11d9a67e58dd552be50b9d58263b937de837"';
    const expectedHash = '1:88006f3b3abcdef52e8ce75a41c96eec2ff5b35c691469b55ddbed4dbed1e64baa6ac006f3fbca55151cc311991d11d9a67e58dd552be50b9d58263b937de837';
    const {sql, hash} = createTableBuilder(tableName, fieldDefinition);
    expect(sql).toEqual(expectedSQL);
    expect(hash).toEqual(expectedHash);
});
