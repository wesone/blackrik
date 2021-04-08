
import { conditionBuilder } from '../../../src/adapters/readmodelstore-mysql/ConditionBuilder';

test('Build field based condition', () => {
    const condition = {
        a: {
            $or: {
                $eq: 1, 
                $gt: 2,
            }
        }, 
        b: {
            $gt: 42
        },
        c: 'Hans',
        c2: new Date('December 17, 2021 03:24:00'),
        c3: 42,
        c4: null,
        d: {
            $isNot: null,
        },
        e: {
            $eq: null,
        },
        f: {
            $ne: null,
        },
        g: {
            $and: {
                $gte: 42,
                $lte: 50,
            }
        },
        h: {
            $in: ['asd', 'efg'],
        },
        i: {
            $not: {
                $eq: 1337,
                $lt: 42,
            }
        },
        j: {
            $nor: {
                $lt: 3,
                $and: {
                    $lt: 8,
                    $gt: 2,
                },
            }
        }
    };
   
    const expectedSQL = '(`a` = ? OR `a` > ?) AND `b` > ? AND `c` = ? AND `c2` = ? AND `c3` = ? AND `c4` IS NULL AND `d` IS NOT NULL AND `e` IS NULL AND `f` IS NOT NULL AND (`g` >= ? AND `g` <= ?) AND `h` IN (?, ?) AND NOT (`i` = ? AND `i` < ?) AND NOT (`j` < ? OR (`j` < ? AND `j` > ?))';
    const expectedParameters = [
        '1',
        '2',
        '42',
        'Hans',
        '2021-12-17 02:24:00',
        '42',
        '42',
        '50',
        'asd',
        'efg',
        '1337',
        '42',
        '3',
        '8',
        '2'
    ];
    const {sql, parameters} = conditionBuilder(condition);
    expect(sql).toEqual(expectedSQL);
    expect(parameters).toEqual(expectedParameters);
});

test('Build condition with logic operator on top level', () => {
    
    const condition = {
        $or: [
            {a: {$eq: 1}},
            {b: {$gt: new Date('December 17, 2021 03:24:00')}},
            {c: {$or: {$gt: 5, $lte: 8}}},
            {d: {$eq: 'ASD'}},
            {f: 42},
        ]
    };
    
    const expectedSQL = '(`a` = ? OR `b` > ? OR (`c` > ? OR `c` <= ?) OR `d` = ? OR `f` = ?)';
    const expectedParameters = ['1' ,'2021-12-17 02:24:00' ,'5' ,'8' ,'ASD' ,'42'];
    const {sql, parameters} = conditionBuilder(condition);
    expect(sql).toEqual(expectedSQL);
    expect(parameters).toEqual(expectedParameters);
});

test('Build condition with undefined value', () => {
    
    const condition = {a: undefined};
    const expectedError = new Error('Field a has invalid "undefined" value');
    expect(() => conditionBuilder(condition)).toThrow(expectedError);
});
