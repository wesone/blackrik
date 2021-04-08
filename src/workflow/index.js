const { SAGA_WORKFLOW_TABLE_NAME } = require('../core/Constants');
class Workflow {
    constructor(config){
        this.config = {...config};
        // validate config
        this.initState = {
            name: this.config.name ?? 'workflow',
            version: this.config.version ?? 1,
            value: this.config.initial,
            context: {...this.config.context},
            idHandler: this.config.idHandler ?? (event => event.aggregateId),
            changed: false,
            currentEvent: {},
            history: [],
            done: false,
            rollback: null,
            updatedAt: null,
        };
        this.state = null;
    }

    getId(event)
    {
        return `${this.config.name}__${this.config.idHandler(event)}`;
    }

    async initializeState()
    {
        this.setState({...this.initState});
        await this.executeActions();
    }

    getCurrentStep()
    {
        const value = this.state.value;
        const step = this.config.steps[value];
        if(!step)
            throw new Error('No step found for current Statemachine value');
        return step;
    }

    getNextTransition(event)
    {
        if(this.state.done || this.state.rollback !== null)
        {
            return null;
        }
        // TODO: check lastPosition
        const step = this.getCurrentStep();
        let eventName = event;
        if(typeof event === 'object')
        {
            eventName = event.type;
        }
        return step.on?.[Object.keys(step.on).find(key => key === eventName)];
    }

    async executeActions()
    {
        const step = this.getCurrentStep();
        let nextEvent = null;
        try
        {
            await step?.actions?.reduce(async (memo, action) => {
                await memo;
                await action?.({context: this.state.context, 
                    currentEvent: this.state.currentEvent, 
                    history: this.state.history,
                    transition: event => nextEvent = event,
                    rollback: (error = new Error('Rollback')) => {
                        error.rollback = true;
                        throw error;
                    },
                    sideEffects: this.sideEffects ?? {},
                    store: this.store ?? null
                });
                
            }, undefined);
        }
        catch(error)
        {
            if(error.rollback)
            {
                return await this.doRollback();
            }
            return error;
        }
        
        
        if(nextEvent)
        {
            return await this.transition(nextEvent);
        }

    }

    async doRollback()
    {
        console.log('Rollback', this.state.history.length);
        if(this.state.rollback === null)
        {
            this.state.rollback = this.state.history.length;
        }
        for(; this.state.rollback > -1; this.state.rollback --)
        {
            this.state.changed = true;
            const historyEntry = this.state.history[this.state.rollback];
            const {action, event} = this.getRollback(this.state.rollback, historyEntry);
            console.log('rollback for event:', event, this.state.rollback);
            await this.executeRollbackAction(action, event);
        }
    }

    getRollback(value, historyEntry)
    {
        if(value === this.state.history.length)
        {
            return {action: this.config.steps[this.state.value]?.rollbackAction, event: this.state.currentEvent};
        }
        return {action: this.config.steps[historyEntry.step]?.rollbackAction, event: historyEntry?.event};
    }

    async executeRollbackAction(action, event)
    {
        console.log('context before:', this.state.context);
        await action?.({context: this.state.context, 
            currentEvent: this.state.currentEvent, 
            originalEvent: event,
            history: this.state.history,
            sideEffects: this.sideEffects ?? {},
            store: this.store ?? null
        });
        console.log('context after:', this.state.context);
    }

    async transition(event)
    {
        if(this.state.rollback !== null && this.state.rollback >= 0)
        {
            await this.doRollback();
            return this.state;
        }
        const transition = this.getNextTransition(event);
        console.log('transition', transition);
        if(!transition)
            return this.state;
        this.state.history.push({
            step: this.state.value,
            event: {...this.state.currentEvent}, 
            context: {...this.state.context}, 
            updatedAt: this.state.updatedAt
        });
        this.state.value = transition;
        this.state.currentEvent = event;
        this.state.changed = true;
        this.state.updatedAt = new Date();

        if(transition === 'done')
        {
            this.state.done = true;
            return this.state;
        }
        // execute transition target actions
        await this.executeActions();

        return this.state;
    }

    async insertState(state, id)
    {
        if(!this.store)
        {
            throw new Error('No store set');
        }
        if(!state)
        {
            throw new Error('State needed');
        }
        const currentDate = new Date();
        await this.store.insert(SAGA_WORKFLOW_TABLE_NAME,{
            id,
            state,
            done: state.done,
            failed: !!state.rollback,
            createdAt: currentDate,
            updatedAt: currentDate
        });
    }

    async saveState()
    {
        if(!this.store)
        {
            throw new Error('No store set');
        }
        if(!this.state)
        {
            throw new Error('No state loaded');
        }
        if(!this.state.changed)
        {
            return;
        }
        await this.store.update(SAGA_WORKFLOW_TABLE_NAME,
            {
                id: this.getId(this.state.currentEvent),
            },{
                state: this.state,
                done: this.state.done,
                failed: this.state.rollback !== null,
                updatedAt: this.state.updatedAt
            }
        );
    }

    async loadState(event)
    {
        if(!this.store)
        {
            throw new Error('No store set');
        }
        const state = this.store.findOne(SAGA_WORKFLOW_TABLE_NAME, {id: this.getId(event)});
        if(!state)
        {
            await this.initializeState();
            await this.insertState(this.state,  this.getId(event));
            return this.state;
        }
        this.setState(state);
        return this.state;
    }

    setState(state)
    {
        this.state = state;
        this.state.changed = false;
    }

    async setupStore(store)
    {
        this.store = store;

        await this.store.defineTable(SAGA_WORKFLOW_TABLE_NAME, {
            id: {
                type: 'String',
                primaryKey: true,
            },
            state: 'JSON',
            done: 'Boolean',
            failed: 'Boolean',
            createdAt: 'Date',
            updatedAt: 'Date',
        });
    }

    setSideEffects(sideEffects)
    {
        this.sideEffects = sideEffects;
    }

    genBlackrikHandlers()
    {
        const eventHandlers =  {};
        Object.keys(this.config.steps).forEach(stepKey => {
            const stepEvents = Object.keys(this.config.steps[stepKey].on);
            stepEvents.forEach(name => {
                if(name !== name.toUpperCase())
                {
                    return; // internal event
                }
                eventHandlers[name] = async ( _,  event, sideEffects) => {
                    this.setSideEffects(sideEffects);
                    await this.loadState(event);
                    try 
                    {
                        await this.transition(event);
                    }
                    finally 
                    {
                        await this.saveState();
                    }
                };
            });
        });
        return eventHandlers;
    }

    connect()
    {
        return {
            handlers: {
                init: async store => {
                    await this.setupStore(store);
                    return {
                        noopSideEffectsOnReplay: false
                    };
                },
                ...this.genBlackrikHandlers(), 
            },
            sideEffects: {}
        };
    }


}

function red(workflow)
{
    workflow.context.redLights ++;
    console.log(`Red again, for ${workflow.context.redLights} times.`, workflow.currentEvent.i);
    if(workflow.context.redLights === 6)
    {
        //return workflow.transition('done');
        return workflow.rollback();
    }
    if(workflow.context.redLights % 3 === 0)
    {
        console.log('Hah, double red!');
        workflow.transition('red_again');
    }
}   

const lightMachine = new Workflow({
    name: 'light',
    version: 1,
    initial: 'init',
    context: { redLights: 0 },
    idHandler: event => event.aggregateId,
    steps: {
        init:{
            actions: [() => console.log('I am initialized!')],
            on: {
                TIMER: 'green'
            }
        },
        green: {
            rollbackAction: (_, error) => console.log('rollback green'),
            on: {
                TIMER: 'yellow'
            }
        },
        yellow: {
            actions: [workflow => console.log('I am yellow', workflow.currentEvent.i)],
            rollbackAction: (_, error) => console.log('rollback yellow'),
            on: {
                TIMER: 'red',
            }
        },
        red: {
            actions: [red],
            rollbackAction: (workflow, error) => {
                console.log('rollback red');
                workflow.context.redLights --;
            },
            on: {
                TIMER: 'green',
                red_again: 'red',
                done: 'done'
            },
        }
    }
});
console.log(lightMachine.connect());

(async () => {
    let state = await lightMachine.initializeState();
    for(let i = 0; i < 20; i++)
    {
        state = await lightMachine.transition({type: 'TIMER', aggregateId: 'asd123', i});
    }
    console.log(JSON.stringify(state, null, 2));
})();

/*
state = {
    id: 'light',
    version: 1,
    value: 'step1',
    context: {},
    changed: true,
    currentEvent: {},
    previousEvents: [],
    done: false,
    rollback: {
        step: 'adasd',
        index: 5,
    }
};
*/
