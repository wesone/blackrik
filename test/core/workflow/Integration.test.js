
const Workflow = require('../../../src/core/workflow');
const Adapter = require('../../../src/adapters/readmodelstore-mysql/Adapter');
const {SAGA_WORKFLOW_TABLE_NAME} = require('../../../src/core/Constants');

let adapter;

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

beforeAll(() => {
    adapter = new Adapter({ 
        //debugSql: true,
        host: 'localhost',
        user: 'root',
        password: '1234',
        useDatabase: 'TestWorkflowTable'
    });
});

afterAll(async () => {
    await adapter.exec(`DROP DATABASE IF EXISTS ${adapter.args.database}`, []);
    return adapter.disconnect();
});

test('test with MySQL DB', async () => {
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
    await sagaConfig.handlers.init(adapter);

    for(let i = 1; i < 20; i++)
    {
        await sagaConfig.handlers.TIMER(null, {type: 'TIMER', aggregateId: 'asd123', position: i}, {});
    }

    //Simulate replay
    for(let j = 1; j < 20; j++)
    {
        await sagaConfig.handlers.TIMER(null, {type: 'TIMER', aggregateId: 'asd123', position: j}, {});
    }

    const data = await adapter.find(SAGA_WORKFLOW_TABLE_NAME, {id: 'asd123'});
    
    expect(data).toHaveLength(2);
    expect(data[0]).toMatchObject({
        'state': {
            'name': 'light',
            'version': 1,
            'value': 'done',
            'context': {
                'redLights': 6
            },
            'changed': true,
            'currentEvent': 'done',
            'history': expect.anything(),
            'done': true,
            'rollback': null,
        },
        'done': 1,
        'failed': 0
    });

    expect(data[0].state.history).toHaveLength(19);
    expect(data[1].state.history).toHaveLength(2);

});
