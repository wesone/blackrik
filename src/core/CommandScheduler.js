const TABLE_NAME = '__SCHEDULED_COMMANDS';

class CommandScheduler
{
    #blackrik;
    #store;
    #jobs;

    constructor(blackrik, store)
    {
        this.#blackrik = blackrik;
        this.#store = store;
        this.#jobs = new Set();
    }

    async init()
    {
        await this.#store.defineTable(TABLE_NAME, {
            id: {
                type: 'Integer',
                primaryKey: true,
                autoIncrement: true
            },
            timestamp: {
                type: 'Integer'
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
                sort: {
                    timestamp: 1
                }
            })).map(({id, timestamp, command, causationEvent}) => this._schedule(id, timestamp, command, causationEvent))
        );
    }

    async _execute(command, causationEvent)
    {
        return this.#blackrik.executeCommand(command, causationEvent);
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
                await this._execute(command, causationEvent);
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
            return this._execute(command, causationEvent);

        const {id} = await this.#store.insert(TABLE_NAME, {timestamp, command, causationEvent});
        return this._schedule(id, timestamp, command, causationEvent);
    }
}

module.exports = CommandScheduler;
