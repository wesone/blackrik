
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
   
    const expectedSQL = 'CREATE TABLE `TestTable` (`id` CHAR(36), `test` VARCHAR(512) NULL, `testDate` TIMESTAMP, `testInt` DOUBLE, `testInc` DOUBLE, `testDefault` VARCHAR(512) DEFAULT \'Ein Test\', `testShorthand` TIMESTAMP, PRIMARY KEY ( `id` ), UNIQUE KEY `index_1` ( `testInt` ), UNIQUE KEY `index_2` ( `testInc` )) COMMENT="1:d859fc83ac11f80b3aa1f20be2dc7a5069505c07ab516aafec7bb1adcc941407f911244d93c9409374e38d565b436d4f029e932c68025260caa97b539b3379af"';
    const expectedHash = '1:d859fc83ac11f80b3aa1f20be2dc7a5069505c07ab516aafec7bb1adcc941407f911244d93c9409374e38d565b436d4f029e932c68025260caa97b539b3379af';
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
   
    const expectedSQL = 'CREATE TABLE `TestTable` (`id` CHAR(36), `test` VARCHAR(512), `testDate` VARCHAR(512), `testInt` VARCHAR(512), `testInc` VARCHAR(512), `testDefault` VARCHAR(512), `testShorthand` TIMESTAMP, PRIMARY KEY ( `id` )) COMMENT="1:76f66570ab69aa004e86e87d3d1ff665779c84f1e409f10452b61bc380c5088ae45e44b766aceee5dc920c2d5f7cb1f7eb1741c39bb935dcf020e673d5517fb1"';
    const expectedHash = '1:76f66570ab69aa004e86e87d3d1ff665779c84f1e409f10452b61bc380c5088ae45e44b766aceee5dc920c2d5f7cb1f7eb1741c39bb935dcf020e673d5517fb1';
    const {sql, hash} = createTableBuilder(tableName, fieldDefinition);
    expect(sql).toEqual(expectedSQL);
    expect(hash).toEqual(expectedHash);
});

test('indexes', () => {
    const fieldDefinition = {
        test: 'String',
        testDate: 'String',
        testInt: 'String',
        testInc: 'String',
        id: {
            type: 'uuid',
        },
        testDefault:'String',
        testShorthand: 'Date',
    };

    const indexes = [
        {fields: ['id', 'test'], primaryKey: true},
        {fields: ['id', 'test', 'testDate'], unique: true},
        {fields: ['testInt', 'testInc'], name: 'myIndex'},
    ];
   
    const expectedSQL = 'CREATE TABLE `TestTable` (`test` VARCHAR(512), `testDate` VARCHAR(512), `testInt` VARCHAR(512), `testInc` VARCHAR(512), `id` CHAR(36), `testDefault` VARCHAR(512), `testShorthand` TIMESTAMP, PRIMARY KEY ( `id`, `test` ), UNIQUE KEY `index_1` ( `id`, `test`, `testDate` ), KEY `myIndex` ( `testInt`, `testInc` )) COMMENT="1:9304b9f596f20b3918e3da30cfdf04bf85c90fcfdaa349b08ea29c5d56de733b233ffac0fbcfc0c9d7e3c01ce8c58e189ebe264fceb7e86f0ea7d2ea60d33eb9"';
    const expectedHash = '1:9304b9f596f20b3918e3da30cfdf04bf85c90fcfdaa349b08ea29c5d56de733b233ffac0fbcfc0c9d7e3c01ce8c58e189ebe264fceb7e86f0ea7d2ea60d33eb9';
    const {sql, hash} = createTableBuilder(tableName, fieldDefinition, indexes);
    expect(sql).toEqual(expectedSQL);
    expect(hash).toEqual(expectedHash);
});

test('indexes order', () => {
    const fieldDefinition = {
        test: 'String',
        testDate: 'String',
        testInt: 'String',
        testInc: 'String',
        id: {
            type: 'uuid',
        },
        testDefault:'String',
        testShorthand: 'Date',
    };

    const indexes = [
        {fields: ['id', 'test', 'testDate'], unique: true},
        {fields: ['id', 'test'], primaryKey: true},
        {fields: ['testInt', 'testInc'], name: 'myIndex'},
        {fields: ['testDefault', 'testShorthand'], unique: true},
    ];
   
    const expectedSQL = 'CREATE TABLE `TestTable` (`test` VARCHAR(512), `testDate` VARCHAR(512), `testInt` VARCHAR(512), `testInc` VARCHAR(512), `id` CHAR(36), `testDefault` VARCHAR(512), `testShorthand` TIMESTAMP, PRIMARY KEY ( `id`, `test` ), UNIQUE KEY `index_0` ( `id`, `test`, `testDate` ), UNIQUE KEY `index_3` ( `testDefault`, `testShorthand` ), KEY `myIndex` ( `testInt`, `testInc` )) COMMENT="1:9d4df0dfc453e2d862325cdab8ebb358853b2359c0702ec9664dc9d9c048502cda73564e56e3eac15a5271caf337b584a00c87044bdb7824dd04b036346e53e6"';
    const expectedHash = '1:9d4df0dfc453e2d862325cdab8ebb358853b2359c0702ec9664dc9d9c048502cda73564e56e3eac15a5271caf337b584a00c87044bdb7824dd04b036346e53e6';
    const {sql, hash} = createTableBuilder(tableName, fieldDefinition, indexes);
    expect(sql).toEqual(expectedSQL);
    expect(hash).toEqual(expectedHash);
});

test('indexes exceptions', () => {
    const fieldDefinition = {
        test1: 'Boolean',
        test2: 'Boolean',
        test3: 'Boolean',
        test4: 'Boolean',
        test5: 'Boolean',
        test6: 'Boolean',
        test7: 'Boolean',
        test8: 'Boolean',
        test9: 'Boolean',
        test10: 'Boolean',
        test11: 'Boolean',
        test12: 'Boolean',
        test13: 'Boolean',
        test14: 'Boolean',
        test15: 'Boolean',
        test16: 'Boolean',
        test17: 'Boolean',
        test18: 'Boolean',
        test19: 'Boolean',
        test20: 'Boolean',
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
