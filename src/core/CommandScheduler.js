const {COMMAND_SCHEDULER_TABLE_NAME: TABLE_NAME} = require('./Constants');

class CommandScheduler
{
    #exec;
    #store;
    #jobs;

    constructor(executor, store)
    {
        this.#exec = executor;
        this.#store = store;
        this.#jobs = new Set();
    }

    async init()
    {
        await this.#store.defineTable(TABLE_NAME, {
            id: {
                type: 'Number',
                primaryKey: true,
                autoIncrement: true
            },
            timestamp: {
                type: 'Number'
            },
            command: {
                type: 'JSON'
            },
            causationEvent: {
                type: 'JSON'
            }
        });
        await Promise.all(
            (await this.#store.find(TABLE_NAME, null, {
                sort: [{
                    timestamp: 1
                }]
            })).map(({id, timestamp, command, causationEvent}) => this._schedule(id, timestamp, command, causationEvent))
        );
    }

    _getDelay(timestamp)
    {
        return timestamp - Date.now();
    }

    async _schedule(id, timestamp, command, causationEvent)
    {
        const delay = Math.max(this._getDelay(timestamp), 0);
        const timer = setTimeout(async () => {
            this.#jobs.delete(timer);
            if((await this.#store.delete(TABLE_NAME, {id})).affected)
                await this.#exec(command, causationEvent);
        }, delay);
        this.#jobs.add(timer);
        return true;
    }

    async process(timestamp, command, causationEvent)
    {
        //TODO should we handle double execution with multiple instances?
        if(
            !timestamp || isNaN(timestamp) ||
            !command || !command.aggregateName || !command.aggregateId || !command.type
        )
            return false;

        if(this._getDelay(timestamp) <= 0)
            return this.#exec(command, causationEvent);

        const {id} = await this.#store.insert(TABLE_NAME, {timestamp, command, causationEvent});
        return this._schedule(id, timestamp, command, causationEvent);
    }
}

module.exports = CommandScheduler;
