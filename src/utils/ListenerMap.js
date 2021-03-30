class ListenerMap
{
    constructor()
    {
        this.map = {};
    }

    add(type, callback)
    {
        const created = this.map[type] === undefined;
        if(created)
            this.map[type] = [];
        this.map[type].push(callback);
        return created;
    }

    execute(type, ...args)
    {
        if(this.map[type] && this.map[type].length)
            return this.map[type].map(consumer => consumer(...args));
    }
}

module.exports = ListenerMap;