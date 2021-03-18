
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
        }
    };
   
    const expectedSQL = 'CREATE TABLE `TestTable` (`id` CHAR(36) PRIMARY KEY, `test` VARCHAR(512) NULL, `testDate` DATETIME, `testInt` INTEGER UNIQUE, `testInc` FLOAT UNIQUE AUTO_INCREMENT, `testDefault` VARCHAR(512) DEFAULT \'Ein Test\') COMMENT="1:dafeb6dc8c8fe7ff6d5bba42a9411334ffa54c5f4a8d062a8db5993588f689256159925b23b5367c5a66979d62830eb5066b6d9c3ed86344ec601629a1dd5763"';
    const expectedHash = '1:dafeb6dc8c8fe7ff6d5bba42a9411334ffa54c5f4a8d062a8db5993588f689256159925b23b5367c5a66979d62830eb5066b6d9c3ed86344ec601629a1dd5763';
    const {sql, hash} = createTableBuilder(tableName, fieldDefinition);
    expect(sql).toEqual(expectedSQL);
    expect(hash).toEqual(expectedHash);
});
