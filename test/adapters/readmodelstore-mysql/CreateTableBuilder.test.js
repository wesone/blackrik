
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
   
    const expectedSQL = 'CREATE TABLE `TestTable` (`id` CHAR(36), `test` VARCHAR(512) NULL, `testDate` DATETIME, `testInt` DOUBLE, `testInc` DOUBLE, `testDefault` VARCHAR(512) DEFAULT \'Ein Test\', `testShorthand` DATETIME, PRIMARY KEY ( `id` ), UNIQUE KEY `index_1` ( `testInt` ), UNIQUE KEY `index_2` ( `testInc` ), INDEX `index_3` ( `testDefault` )) COMMENT="1:6ec67328e62acb39e1ea7f96837e9d185d8f0002e91e4e0d5da644ecfe03c09f06d7efd50eab2d01e6bd3f5d86e63391781d3975910040f49353c7424e72f606"';
    const expectedHash = '1:6ec67328e62acb39e1ea7f96837e9d185d8f0002e91e4e0d5da644ecfe03c09f06d7efd50eab2d01e6bd3f5d86e63391781d3975910040f49353c7424e72f606';
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
   
    const expectedSQL = 'CREATE TABLE `TestTable` (`id` CHAR(36), `test` VARCHAR(512), `testDate` VARCHAR(512), `testInt` VARCHAR(512), `testInc` VARCHAR(512), `testDefault` VARCHAR(512), `testShorthand` DATETIME, PRIMARY KEY ( `id` )) COMMENT="1:d5d1526ea1119a9c91e111ce4d2b88a47a2a634ac0bc6cf942b1fd7566c692312ac0b6d565398f861daec5417123a57494fa1f25bd3c2b6b670fa3c13dfb2cd1"';
    const expectedHash = '1:d5d1526ea1119a9c91e111ce4d2b88a47a2a634ac0bc6cf942b1fd7566c692312ac0b6d565398f861daec5417123a57494fa1f25bd3c2b6b670fa3c13dfb2cd1';
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
   
    const expectedSQL = 'CREATE TABLE `TestTable` (`test` VARCHAR(512), `testDate` VARCHAR(512), `testInt` VARCHAR(512), `testInc` VARCHAR(512), `id` CHAR(36), `testDefault` VARCHAR(512), `testShorthand` DATETIME, `testFulltext` TEXT, PRIMARY KEY ( `id`, `test` ), UNIQUE KEY `index_1` ( `id`, `test`, `testDate` ), INDEX `myIndex` ( `testInt`, `testInc` ), FULLTEXT `index_3` ( `testFulltext` )) COMMENT="1:4727769f2c3e64b40d08083df309ded43417a3993851db969c8849553049f9c7c2aff2a183e8f7543ab7acf813fc7317c980ca1e118b6d797b76bde858e46e8d"';
    const expectedHash = '1:4727769f2c3e64b40d08083df309ded43417a3993851db969c8849553049f9c7c2aff2a183e8f7543ab7acf813fc7317c980ca1e118b6d797b76bde858e46e8d';
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
   
    const expectedSQL = 'CREATE TABLE `TestTable` (`test` VARCHAR(512), `testDate` VARCHAR(512), `testInt` VARCHAR(512), `testInc` VARCHAR(512), `id` CHAR(36), `testDefault` VARCHAR(512), `testShorthand` DATETIME, PRIMARY KEY ( `id`, `test` ), UNIQUE KEY `index_0` ( `id`, `test`, `testDate` ), UNIQUE KEY `index_4` ( `testDefault`, `testShorthand` ), FULLTEXT `textsearch` ( `test` ), INDEX `myIndex` ( `testInt`, `testInc` )) COMMENT="1:c8da81d04f787a8d47b4f1045ec5de35db01acec53e437920c9faad1c6a9a0ea2711c61972dca6e6129f517b590ef830cc9705bc0d1f40e7576e593a03f7a2ee"';
    const expectedHash = '1:c8da81d04f787a8d47b4f1045ec5de35db01acec53e437920c9faad1c6a9a0ea2711c61972dca6e6129f517b590ef830cc9705bc0d1f40e7576e593a03f7a2ee';
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
