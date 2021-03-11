class ConsumerList
{
    constructor()
    {
        this.list = {};
    }

    add(type, callback)
    {
        if(this.list[type] === undefined)
            this.list[type] = [];
        this.list[type].push(callback);
    }

    execute(type, ...args)
    {
        if(this.list[type] && this.list[type].length)
            this.list[type].forEach(consumer => consumer(...args));
    }
}

module.exports = ConsumerList;
