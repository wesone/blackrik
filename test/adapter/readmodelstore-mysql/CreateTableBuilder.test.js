
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
        },
        testDefault: {
            type: 'String',
            defaultValue: 'Ein Test',
        },
        testShorthand: 'Date',
    };
   
    const expectedSQL = 'CREATE TABLE `TestTable` (`id` CHAR(36) PRIMARY KEY, `test` VARCHAR(512) NULL, `testDate` TIMESTAMP, `testInt` DOUBLE UNIQUE, `testInc` DOUBLE UNIQUE, `testDefault` VARCHAR(512) DEFAULT \'Ein Test\', `testShorthand` TIMESTAMP) COMMENT="1:31a1d5ab436cfd5eec567d7c160fe81d4a9a1e6f38d58800d3f9132c5a5849d9584d6f2bb264c218f380da515c717e298da9610cd472412801c5eb577e7fd6f4"';
    const expectedHash = '1:31a1d5ab436cfd5eec567d7c160fe81d4a9a1e6f38d58800d3f9132c5a5849d9584d6f2bb264c218f380da515c717e298da9610cd472412801c5eb577e7fd6f4';
    const {sql, hash} = createTableBuilder(tableName, fieldDefinition);
    expect(sql).toEqual(expectedSQL);
    expect(hash).toEqual(expectedHash);
});


test('primary key order', () => {
    const fieldDefinition = {
        test: 'String',
        testDate: 'String',
        testInt: 'String',
        testInc: 'String',
        id: {
            type: 'uuid',
            primaryKey: true,
        },
        testDefault:'String',
        testShorthand: 'Date',
    };
   
    const expectedSQL = 'CREATE TABLE `TestTable` (`id` CHAR(36) PRIMARY KEY, `test` VARCHAR(512), `testDate` VARCHAR(512), `testInt` VARCHAR(512), `testInc` VARCHAR(512), `testDefault` VARCHAR(512), `testShorthand` TIMESTAMP) COMMENT="1:0edfe898ac2c1a770dc16a60a24ff7e9c26644f1b59e48d341b605535349bfe57e4ce47df80eabdd57f0e1e9589f786d6928fb80d68cd8888b6c8e88e732c238"';
    const expectedHash = '1:0edfe898ac2c1a770dc16a60a24ff7e9c26644f1b59e48d341b605535349bfe57e4ce47df80eabdd57f0e1e9589f786d6928fb80d68cd8888b6c8e88e732c238';
    const {sql, hash} = createTableBuilder(tableName, fieldDefinition);
    expect(sql).toEqual(expectedSQL);
    expect(hash).toEqual(expectedHash);
});
