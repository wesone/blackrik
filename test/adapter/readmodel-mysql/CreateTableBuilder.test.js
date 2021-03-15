
import { createTableBuilder } from '../../../src/adapters/readmodelstore-mysql/CreateTableBuilder';

const tableName = 'TestTable';

test('Build field based condition', () => {
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
   
    const expectedSQL = 'CREATE TABLE TestTable (`id` CHAR(36) PRIMARY KEY, `test` VARCHAR(512) NULL, `testDate` DATETIME, `testInt` INTEGER UNIQUE, `testInc` FLOAT UNIQUE AUTO_INCREMENT, `testDefault` VARCHAR(512) DEFAULT \'Ein Test\')';
    const sql = createTableBuilder(tableName, fieldDefinition);
    expect(sql).toEqual(expectedSQL);
});
