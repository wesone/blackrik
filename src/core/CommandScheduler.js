class CommandScheduler
{
    #blackrik;
    #jobs;

    constructor(blackrik)
    {
        this.#blackrik = blackrik;
        this.#jobs = new Set();
    }

    async init()
    {
        //TODO load from presistence and schedule everything
    }

    async _execute(command, causationEvent)
    {
        return this.#blackrik.executeCommand(command, causationEvent);
    }

    async schedule(timestamp, command, causationEvent)
    {
        const delay = timestamp - Date.now();
        if(delay <= 0)
            return this._execute(command, causationEvent);

        //TODO persist
        const timer = setTimeout(async () => {
            //TODO prevent multiple executions in case there are multiple instances
            this.#jobs.delete(timer);
            await this._execute(command, causationEvent);
            //TODO remove from persistence
        }, delay);
        this.#jobs.add(timer);
    }
}

module.exports = CommandScheduler;
