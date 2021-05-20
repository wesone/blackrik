const EventEmitter = require('events');

class Q extends EventEmitter
{
    #queue = [];
    #pending = [];

    get length()
    {
        return this.#queue.length;
    }

    add(item)
    {
        this.#queue.push(item);
        return item;
    }

    next() 
    {
        if(!this.length)
            return;

        const item = this.#queue.shift();
        const isLast = this.length <= 1;
        let found = false;
        for(let i = 0; i < this.#pending.length; i++)
        {
            const {item: subject, resolve, reject} = this.#pending[i];
            if(subject === item || isLast)
            {
                if(subject === item)
                    resolve(item);
                else
                    reject();
                    
                this.#pending.splice(i, 1);
                i--;
                found = true;
            }
        }

        this.emit('handle', item);

        if(!found)
            this.next();
    }

    waitFor(item)
    {
        const promise = new Promise((resolve, reject) => {
            this.#pending.push({
                item,
                resolve,
                reject
            });
        });
        return promise;
    }
};

module.exports = Q;
