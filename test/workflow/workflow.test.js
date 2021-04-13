import Workflow from '../../src/core/workflow';

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

    for(let i = 1; i < 20; i++)
    {
        await sagaConfig.handlers.TIMER(null, {type: 'TIMER', aggregateId: 'asd123', position: i}, {});
    }

    expect(store.data).toMatchObject({
        'asd123': {
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

    expect(store.data['asd123'].state.history).toHaveLength(19);

});

test('test workflow rollback', async () => {
    function redRollback(workflow)
    {
        if(workflow.context.redLights === 6)
        {
            return workflow.rollback();
        }
    }   
    const config = {...testConfig};
    config.steps.red.actions[1] = redRollback;
    const lightMachine = new Workflow(config);
    const sagaConfig = lightMachine.connect();
    const store = new MockStore();
    await sagaConfig.handlers.init(store);
    await sagaConfig.handlers.TIMER(null, {type: 'TIMER', aggregateId: 'asd123'}, {});
    await expect(async () => {
        for(let i = 0; i < 20; i++)
        {
            await sagaConfig.handlers.TIMER(null, {type: 'TIMER', aggregateId: 'asd123', i}, {});
        }
    }).rejects.toThrow();
    
    expect(store.data).toMatchObject({
        'asd123': {
            'state': {
                'name': 'light',
                'version': 1,
                'value': 'red',
                'context': {
                    'redLights': 0
                },
                'changed': true,
                'currentEvent': {
                    'aggregateId': 'asd123',
                    'type': 'TIMER',
                },
                'history': expect.anything(),
                'done': true,
                'rollback': -1,
                'error': expect.objectContaining({message: 'Rollback'}),
            },
            'done': true,
            'failed': true
        }
    });

    expect(store.data['asd123'].state.history).toHaveLength(18);
});

test('workflow errors', async () => {
    expect(() => new Workflow({})).toThrow(new Error('Workflow needs a name'));
    expect(() => new Workflow({name: 'test'})).toThrow(new Error('Workflow needs at least one step'));
    expect(() => new Workflow({name: 'test', steps: {test: {}}})).toThrow(new Error('inital ist not set'));

    const workflow = new Workflow({name: 'test2', steps: {test: {on: {test2: 'test2'}}, test2: {on: {test: 'test'}}}, initial: 'test'});
    expect(() => workflow.insertState()).rejects.toThrow('No store set');
    expect(() => workflow.saveState()).rejects.toThrow('No store set');
    expect(() => workflow.loadState()).rejects.toThrow('No store set');

    workflow.setupStore(new MockStore());
    expect(() => workflow.insertState()).rejects.toThrow('State needed');
    expect(() => workflow.saveState()).rejects.toThrow('No state loaded');

    workflow.setState({...workflow.initializeState(), value: 'fail', lastPosition: 1, rollback: null});
    expect(() => workflow.getCurrentStep()).toThrow(new Error('No step found for current Statemachine value'));

    expect(workflow.getNextTransition({type: 'test2', position: 1})).toEqual(null);

    workflow.setState({...workflow.initializeState(), value: 'fail', lastPosition: 1, rollback: 1, history: [{},{},{}]});
    const result = await workflow.transition({type: 'test2', position: 1});
    expect(result).toMatchObject({'rollback': -1});

});
