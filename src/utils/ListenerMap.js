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

    // calls all listeners at once
    execute(type, ...args)
    {
        if(this.map[type] && this.map[type].length)
            return this.map[type].map(listener => listener(...args));
        return [];
    }

    // calls all listeners in series
    async iterate(type, ...args)
    {
        if(!this.map[type] || !this.map[type].length)
            return;

        for(const listener of this.map[type])
            await listener(...args);
    }
}

module.exports = ListenerMap;
