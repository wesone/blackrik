
import { createTableBuilder } from '../../../src/adapters/readmodelstore-mysql/CreateTableBuilder';

const tableName = 'TestTable';

test('Build creat table statement', () => {
    const fieldDefinition = {
        id: {
            type: 'uuid',
            primaryKey: true,
        },
        test: {
            type: 'string',
            allowNull: true,
        },
        testDate: {
            type: 'date',
        },
        testInt: {
            type: 'number',
            unique: true,
        },
        testInc: {
            type: 'number',
            unique: true,
        },
        testDefault: {
            type: 'string',
            defaultValue: 'Ein Test',
            index: true,
        },
        testShorthand: 'Date',
    };
   
    const expectedSQL = 'CREATE TABLE `TestTable` (`id` CHAR(36), `test` VARCHAR(512) NULL, `testDate` TIMESTAMP, `testInt` DOUBLE, `testInc` DOUBLE, `testDefault` VARCHAR(512) DEFAULT \'Ein Test\', `testShorthand` TIMESTAMP, PRIMARY KEY ( `id` ), UNIQUE KEY `index_1` ( `testInt` ), UNIQUE KEY `index_2` ( `testInc` ), INDEX `index_3` ( `testDefault` )) COMMENT="1:3152cbaaf95bd82eecaba564bbd9ac2a7cc3d5a8040ab477a5cf80d345c6f69da3e038810d6398ff694683aa6d4b3648bb6c22ce63ca29f5e46e4b5350ba7865"';
    const expectedHash = '1:3152cbaaf95bd82eecaba564bbd9ac2a7cc3d5a8040ab477a5cf80d345c6f69da3e038810d6398ff694683aa6d4b3648bb6c22ce63ca29f5e46e4b5350ba7865';
    const {sql, hash} = createTableBuilder(tableName, fieldDefinition);
    expect(sql).toEqual(expectedSQL);
    expect(hash).toEqual(expectedHash);
});


test('primary key order', () => {
    const fieldDefinition = {
        test: 'string',
        testDate: 'string',
        testInt: 'string',
        testInc: 'string',
        id: {
            type: 'uuid',
            primaryKey: true,
        },
        testDefault:'string',
        testShorthand: 'date',
    };
   
    const expectedSQL = 'CREATE TABLE `TestTable` (`id` CHAR(36), `test` VARCHAR(512), `testDate` VARCHAR(512), `testInt` VARCHAR(512), `testInc` VARCHAR(512), `testDefault` VARCHAR(512), `testShorthand` TIMESTAMP, PRIMARY KEY ( `id` )) COMMENT="1:76f66570ab69aa004e86e87d3d1ff665779c84f1e409f10452b61bc380c5088ae45e44b766aceee5dc920c2d5f7cb1f7eb1741c39bb935dcf020e673d5517fb1"';
    const expectedHash = '1:76f66570ab69aa004e86e87d3d1ff665779c84f1e409f10452b61bc380c5088ae45e44b766aceee5dc920c2d5f7cb1f7eb1741c39bb935dcf020e673d5517fb1';
    const {sql, hash} = createTableBuilder(tableName, fieldDefinition);
    expect(sql).toEqual(expectedSQL);
    expect(hash).toEqual(expectedHash);
});

test('indexes', () => {
    const fieldDefinition = {
        test: 'string',
        testDate: 'string',
        testInt: 'string',
        testInc: 'string',
        id: {
            type: 'uuid',
        },
        testDefault:'string',
        testShorthand: 'date',
        testFulltext: 'text',
    };

    const indexes = [
        {fields: ['id', 'test'], primaryKey: true},
        {fields: ['id', 'test', 'testDate'], unique: true},
        {fields: ['testInt', 'testInc'], name: 'myIndex'},
        {fields: ['testFulltext'], index: 'fulltext'}
    ];
   
    const expectedSQL = 'CREATE TABLE `TestTable` (`test` VARCHAR(512), `testDate` VARCHAR(512), `testInt` VARCHAR(512), `testInc` VARCHAR(512), `id` CHAR(36), `testDefault` VARCHAR(512), `testShorthand` TIMESTAMP, `testFulltext` TEXT, PRIMARY KEY ( `id`, `test` ), UNIQUE KEY `index_1` ( `id`, `test`, `testDate` ), INDEX `myIndex` ( `testInt`, `testInc` ), FULLTEXT `index_3` ( `testFulltext` )) COMMENT="1:defdb3d1ef7e4636d9051acf407d4944a87a0ca8cca2f717947104002d5214b9a914edea85ce4f4e815a3a30df766a8b4f91ebe7539d3423a660e5cacd5c6b9b"';
    const expectedHash = '1:defdb3d1ef7e4636d9051acf407d4944a87a0ca8cca2f717947104002d5214b9a914edea85ce4f4e815a3a30df766a8b4f91ebe7539d3423a660e5cacd5c6b9b';
    const {sql, hash} = createTableBuilder(tableName, fieldDefinition, indexes);
    expect(sql).toEqual(expectedSQL);
    expect(hash).toEqual(expectedHash);
});

test('indexes order', () => {
    const fieldDefinition = {
        test: 'string',
        testDate: 'string',
        testInt: 'string',
        testInc: 'string',
        id: {
            type: 'uuid',
        },
        testDefault:'string',
        testShorthand: 'date',
    };

    const indexes = [
        {fields: ['id', 'test', 'testDate'], unique: true},
        {fields: ['id', 'test'], primaryKey: true},
        {fields: ['test'], name: 'textsearch', index: 'fulltext'},
        {fields: ['testInt', 'testInc'], name: 'myIndex'},
        {fields: ['testDefault', 'testShorthand'], unique: true},
    ];
   
    const expectedSQL = 'CREATE TABLE `TestTable` (`test` VARCHAR(512), `testDate` VARCHAR(512), `testInt` VARCHAR(512), `testInc` VARCHAR(512), `id` CHAR(36), `testDefault` VARCHAR(512), `testShorthand` TIMESTAMP, PRIMARY KEY ( `id`, `test` ), UNIQUE KEY `index_0` ( `id`, `test`, `testDate` ), UNIQUE KEY `index_4` ( `testDefault`, `testShorthand` ), FULLTEXT `textsearch` ( `test` ), INDEX `myIndex` ( `testInt`, `testInc` )) COMMENT="1:4dd18e30302bef8cf278ce5e18d945bf8eae6cea1ed403092528a109d7c2c244d29a3b9ff2f4be401ec6a9c9df20475e3f78dbfdf8704d3bd9b96eaa96501dec"';
    const expectedHash = '1:4dd18e30302bef8cf278ce5e18d945bf8eae6cea1ed403092528a109d7c2c244d29a3b9ff2f4be401ec6a9c9df20475e3f78dbfdf8704d3bd9b96eaa96501dec';
    const {sql, hash} = createTableBuilder(tableName, fieldDefinition, indexes);
    expect(sql).toEqual(expectedSQL);
    expect(hash).toEqual(expectedHash);
});

test('indexes exceptions', () => {
    const fieldDefinition = {
        test1: 'boolean',
        test2: 'boolean',
        test3: 'boolean',
        test4: 'boolean',
        test5: 'boolean',
        test6: 'boolean',
        test7: 'boolean',
        test8: 'boolean',
        test9: 'boolean',
        test10: 'boolean',
        test11: 'boolean',
        test12: 'boolean',
        test13: 'boolean',
        test14: 'boolean',
        test15: 'boolean',
        test16: 'boolean',
        test17: 'boolean',
        test18: 'boolean',
        test19: 'boolean',
        test20: 'boolean',
    };

    const indexes = [
        {fields: ['test1']},
        {fields: ['test2']},
        {fields: ['test3']},
        {fields: ['test4']},
        {fields: ['test5']},
        {fields: ['test6']},
        {fields: ['test7']},
        {fields: ['test8']},
        {fields: ['test9']},
        {fields: ['test10']},
        {fields: ['test11']},
        {fields: ['test12']},
        {fields: ['test13']},
        {fields: ['test14']},
        {fields: ['test15']},
        {fields: ['test16']},
        {fields: ['test17']},
    ];
   

    expect(() => createTableBuilder(tableName, fieldDefinition, indexes)).toThrow(new Error('Tried to add more then 16 indexes'));

    expect(() => createTableBuilder(tableName, fieldDefinition, [{}])).toThrow(new Error('Index need fields'));

    expect(() => createTableBuilder(tableName, fieldDefinition, [{fields: ['fail']}])).toThrow(new Error('Unknown field \'fail\' for index'));


});

test('variable type length', () => {
    const fieldDefinition = {
        test: 'string(10)',
        test2: 'string',
        test3: { type: 'string(128)' },
        test4: 'boolean'
    };
   
    const expectedSQL = 'CREATE TABLE `TestTable` (`test` VARCHAR(10), `test2` VARCHAR(512), `test3` VARCHAR(128), `test4` TINYINT(1)) COMMENT="1:0809cbbf11f3a4330fcc762edaa025736e85d5580613a8b8da0bba7caefbad6d41d689937d404412da0cd76729c6f46fc72150f8535880a01f07dff1fea6a0a4"';
    const expectedHash = '1:0809cbbf11f3a4330fcc762edaa025736e85d5580613a8b8da0bba7caefbad6d41d689937d404412da0cd76729c6f46fc72150f8535880a01f07dff1fea6a0a4';
    const {sql, hash} = createTableBuilder(tableName, fieldDefinition);
    expect(sql).toEqual(expectedSQL);
    expect(hash).toEqual(expectedHash);
});

test('variable type length error', () => {
    const fieldDefinition = {
        test: 'string(10)',
        test2: 'boolean(2)'
    };

    expect(() => createTableBuilder(tableName, fieldDefinition)).toThrow(new Error('Invalid type: "boolean(2)". Type length only supported for "string"'));
});
