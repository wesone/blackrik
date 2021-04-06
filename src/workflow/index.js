class Workflow {
    constructor(config){
        this.config = {...config};
        // validate config
        this.state = {
            id: this.config.id ?? 'uuid',
            version: this.config.version ?? 1,
            value: this.config.initial,
            context: {...this.config.context},
            changed: false,
            currentEvent: {},
            history: [],
            done: false,
            rollback: null,
        };
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
        // TODO: check lastPosition
        const step = this.getCurrentStep();
        let eventName = event;
        if(typeof event === 'object')
        {
            eventName = event.name;
        }
        return step.on?.[Object.keys(step.on).find(key => key === eventName)];
    }

    async executeActions()
    {
        const step = this.getCurrentStep();
        let nextEvent = null;
        let rollback = null;
        await step?.actions?.reduce(async (memo, action) => {
            await memo;
            await action?.({context: this.state.context, 
                currentEvent: this.state.currentEvent, 
                history: this.state.history,
                transition: event => nextEvent = event,
                rollback: error => rollback = error,
                sideEffects: this.sideEffects ?? {},
                store: this.store ?? null
            });
            if(rollback)
            {
                return this.state; // TODO
            }
        }, undefined);
        
        if(nextEvent)
        {
            return await this.transition(nextEvent);
        }

    }

    async transition(event)
    {
        const transition = this.getNextTransition(event);
        if(!transition)
            return this.state;

        this.state.value = transition;
        this.state.currentEvent = event;
        // execute transition target actions
        await this.executeActions();
        // save state and context
        // TODO: history

        return this.state;
    }

    saveState()
    {

    }

    loadState(id)
    {

    }

    async setupStore(store)
    {
        this.store = store;
        // setup store
    }

    setSideEffects(sideEffects)
    {
        this.sideEffects = sideEffects;
    }

    genBlackrikHandlers()
    {
        const events =  {};
        Object.keys(this.config.steps).forEach(stepKey => {
            const stepEvents = Object.keys(this.config.steps[stepKey].on);
            stepEvents.forEach(name => {
                events[name] = async ( _,  event, sideEffects) => {
                    this.setSideEffects(sideEffects);
                    await this.loadState(1234);
                    await this.transition(event);
                    await this.saveState();
                };
            });
        });

    }

    connect()
    {
        return {
            handlers: {
                init: async store => {
                    await this.setupStore(store);
                    return {
                        noopSideEffectsOnReplay: true
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
    console.log(`Red again, for ${workflow.context.redLights} times.`);
    if(workflow.context.redLights % 3 === 0)
    {
        console.log('Hah, double red!');
        workflow.transition('red_again');
    }
}   

const lightMachine = new Workflow({
    id: 'light',
    version: 1,
    initial: 'green',
    context: { redLights: 0 },
    steps: {
        green: {
            on: {
                TIMER: 'yellow'
            }
        },
        yellow: {
            actions: [() => console.log('I am yellow')],
            on: {
                TIMER: 'red',
            }
        },
        red: {
            actions: [red],
            rollbackActions: [],
            on: {
                TIMER: 'green',
                red_again: 'red'
            },
        }
    }
});
(async () => {
    let state = await lightMachine.transition('TIMER');
    console.log(state);
    state = await lightMachine.transition('TIMER');
    console.log(state);
    state = await lightMachine.transition('TIMER');
    console.log(state);
    state = await lightMachine.transition('TIMER');
    console.log(state);
    state = await lightMachine.transition('TIMER');
    console.log(state);
    state = await lightMachine.transition('TIMER');
    console.log(state);
    state = await lightMachine.transition('TIMER');
    console.log(state);
    state = await lightMachine.transition('TIMER');
    console.log(state);
    state = await lightMachine.transition('TIMER');
    console.log(state);
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
