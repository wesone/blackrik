const {COMMAND_SCHEDULER_TABLE_NAME: TABLE_NAME} = require('./Constants');
const {v4: uuid} = require('uuid');

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

    _getDelay(timestamp)
    {
        return timestamp - Date.now();
    }

    async _schedule(id, timestamp, command, causationEvent)
    {
        const delay = Math.max(this._getDelay(timestamp), 0);
        const timer = setTimeout(async () => {
            this.#jobs.delete(timer);
            if(await this.#store.delete(TABLE_NAME, {id}))
                await this.#exec(command, causationEvent);
        }, delay);
        this.#jobs.add(timer);
        return true;
    }

    async _loadScheduledCommands()
    {
        await Promise.all(
            (await this.#store.find(TABLE_NAME, null, {
                sort: [
                    ['timestamp', 'asc']
                ]
            })).map(({id, timestamp, command, causationEvent}) => this._schedule(id, timestamp, command, causationEvent))
        );
    }

    async init()
    {
        await this.#store.defineTable(TABLE_NAME, {
            id: {
                type: 'number',
                primaryKey: true
            },
            timestamp: 'number',
            command: 'json',
            causationEvent: 'json'
        });
        this._loadScheduledCommands();
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

        const id = uuid();
        await this.#store.insert(TABLE_NAME, {id, timestamp, command, causationEvent});
        return this._schedule(id, timestamp, command, causationEvent);
    }

    stop()
    {
        this.#jobs.forEach(timer => clearTimeout(timer));
        this.#jobs.clear();
    }
}

module.exports = CommandScheduler;
