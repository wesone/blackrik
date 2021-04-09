const { SAGA_WORKFLOW_TABLE_NAME } = require('../core/Constants');
const { serializeError } = require('./SerializeError');
class Workflow {
    constructor(config){
        this.validateConfig(config);
        this.config = {...config, idHandler: config.idHandler ?? (event => event.aggregateId)};
        this.initState = {
            name: this.config.name,
            version: this.config.version ?? 1,
            value: this.config.initial,
            context: {...(this.config.context ?? {})},
            changed: false,
            currentEvent: {},
            history: [],
            done: false,
            rollback: null,
            updatedAt: null,
        };
        this.state = null;
    }

    validateConfig(config)
    {
        if(typeof config.name !== 'string')
            throw new Error('Workflow needs a name');
        if(typeof config.steps !== 'object' || Object.keys(config.steps).length === 0)
            throw new Error('Workflow needs at least one step');
        if(typeof config.initial !== 'string')
            throw new Error('inital ist not set');
    }

    setId(event)
    {
        this.id = `${this.config.name}__${this.config.idHandler(event)}`;
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
                return await this.doRollback(error);
            }
            return error;
        }
        
        
        if(nextEvent)
        {
            return await this.transition(nextEvent);
        }

    }

    async doRollback(error)
    {
        if(this.state.rollback === null)
        {
            this.state.rollback = this.state.history.length;
            this.state.error = serializeError(error);
        }
        for(; this.state.rollback > -1; this.state.rollback --)
        {
            this.state.changed = true;
            const historyEntry = this.state.history[this.state.rollback];
            const {action, event} = this.getRollback(this.state.rollback, historyEntry);
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
        await action?.({context: this.state.context, 
            currentEvent: this.state.currentEvent, 
            originalEvent: event,
            history: this.state.history,
            sideEffects: this.sideEffects ?? {},
            store: this.store ?? null
        });
    }

    async transition(event)
    {
        if(this.state.rollback !== null && this.state.rollback >= 0)
        {
            await this.doRollback();
            return this.state;
        }
        const transition = this.getNextTransition(event);
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
        if(!this.state || !this.id)
        {
            throw new Error('No state loaded');
        }
        if(!this.state.changed)
        {
            return;
        }
        await this.store.update(SAGA_WORKFLOW_TABLE_NAME,
            {
                id: this.id,
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
        this.setId(event);
        const stateRow = await this.store.findOne(SAGA_WORKFLOW_TABLE_NAME, {id: this.id});
        if(!stateRow)
        {
            await this.initializeState();
            await this.insertState(this.state,  this.id);
            return this.state;
        }
        this.setState(stateRow.state);
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

module.exports = Workflow;
