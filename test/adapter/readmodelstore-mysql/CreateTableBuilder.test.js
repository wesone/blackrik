
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
            type: 'Number',
            unique: true,
        },
        testInc: {
            type: 'Number',
            unique: true,
            autoIncrement: true,
        },
        testDefault: {
            type: 'String',
            defaultValue: 'Ein Test',
        },
        testShorthand: 'Date',
    };
   
    const expectedSQL = 'CREATE TABLE `TestTable` (`id` CHAR(36) PRIMARY KEY, `test` VARCHAR(512) NULL, `testDate` TIMESTAMP, `testInt` DOUBLE UNIQUE, `testInc` DOUBLE UNIQUE AUTO_INCREMENT, `testDefault` VARCHAR(512) DEFAULT \'Ein Test\', `testShorthand` TIMESTAMP) COMMENT="1:0f63fea7e6ab9e1ffb44684bfbea45a7b9105305e0b2e6b553000e8f477f61086782b96076a46f705965601a3d085b834dc18f847e23a760aa5fb8459f6c2260"';
    const expectedHash = '1:0f63fea7e6ab9e1ffb44684bfbea45a7b9105305e0b2e6b553000e8f477f61086782b96076a46f705965601a3d085b834dc18f847e23a760aa5fb8459f6c2260';
    const {sql, hash} = createTableBuilder(tableName, fieldDefinition);
    expect(sql).toEqual(expectedSQL);
    expect(hash).toEqual(expectedHash);
});
