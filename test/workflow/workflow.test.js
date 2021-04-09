import Workflow from '../../src/workflow';

class MockStore {
    constructor()
    {
        this.data = {};
        this.defineTable = jest.fn();
    }

    async insert(_, data)
    {
        return this.data[data.id] = data;
    }

    async update(_, conditions, data)
    {
        return this.data[conditions.id] = data;
    }

    async findOne(_, conditions)
    {
        return this.data[conditions.id];
    }
}

const testConfig = {
    name: 'light',
    version: 1,
    initial: 'init',
    context: { redLights: 0 },
    //idHandler: event => event.aggregateId,
    steps: {
        init:{
            on: {
                TIMER: 'green'
            }
        },
        green: {
            on: {
                TIMER: 'yellow'
            }
        },
        yellow: {
            on: {
                TIMER: 'red',
            }
        },
        red: {
            actions: [workflow => workflow.context.redLights ++],
            rollbackAction: workflow => {
                workflow.context.redLights --;
            },
            on: {
                TIMER: 'green',
                done: 'done'
            },
        }
    }
};

test('test workflow', async () => {
    function redDone(workflow)
    {
        if(workflow.context.redLights === 6)
        {
            return workflow.transition('done');
        }
    }   
    const config = {...testConfig};
    config.steps.red.actions[1] = redDone;
    const lightMachine = new Workflow(config);
    const sagaConfig = lightMachine.connect();
    const store = new MockStore();
    await sagaConfig.handlers.init(store);
    await sagaConfig.handlers.TIMER(null, {type: 'TIMER', aggregateId: 'asd123'}, {});

    for(let i = 0; i < 20; i++)
    {
        await sagaConfig.handlers.TIMER(null, {type: 'TIMER', aggregateId: 'asd123'}, {});
    }

    expect(store.data).toMatchObject({
        'light__asd123': {
            'state': {
                'name': 'light',
                'version': 1,
                'value': 'done',
                'context': {
                    'redLights': 6
                },
                'changed': false,
                'currentEvent': 'done',
                'history': expect.anything(),
                'done': true,
                'rollback': null,
            },
            'done': true,
            'failed': false
        }
    });

    expect(store.data['light__asd123'].state.history).toHaveLength(19);

});

test('test workflow rollback', async () => {
    function redRollback(workflow)
    {
        if(workflow.context.redLights === 6)
        {
            return workflow.rollback(new Error('Test error'));
        }
    }   
    const config = {...testConfig};
    config.steps.red.actions[1] = redRollback;
    const lightMachine = new Workflow(config);
    const sagaConfig = lightMachine.connect();
    const store = new MockStore();
    await sagaConfig.handlers.init(store);
    await sagaConfig.handlers.TIMER(null, {type: 'TIMER', aggregateId: 'asd123'}, {});
    for(let i = 0; i < 20; i++)
    {
        await sagaConfig.handlers.TIMER(null, {type: 'TIMER', aggregateId: 'asd123', i}, {});
    }
    expect(store.data).toMatchObject({
        'light__asd123': {
            'state': {
                'name': 'light',
                'version': 1,
                'value': 'red',
                'context': {
                    'redLights': 0
                },
                'changed': false,
                'currentEvent': {
                    'aggregateId': 'asd123',
                    'type': 'TIMER',
                },
                'history': expect.anything(),
                'done': false,
                'rollback': -1,
                'error': expect.objectContaining({message: 'Test error'}),
            },
            'done': false,
            'failed': true
        }
    });

    expect(store.data['light__asd123'].state.history).toHaveLength(18);
});
