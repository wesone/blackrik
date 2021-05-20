const EventEmitter = require('events');

class Q extends EventEmitter
{
    #queue = [];
    #pending = [];
    #coldBoot = false;

    get length()
    {
        return this.#queue.length;
    }

    _handle(item)
    {
        const isLast = !!this.length;
        for(let i = 0; i < this.#pending.length; i++)
        {
            const {item: subject, resolve, reject} = this.#pending[i];
            if(subject === item || isLast)
            {
                if(subject === item)
                    resolve(item);
                else
                    reject();
                    
                this.#pending.slice(i, 1);
                i--;
            }
        }
        this.emit('handle', item);
    }

    add(item)
    {
        if(this.#queue.push(item) === 1)
            this.#coldBoot = true;
        return item;
    }

    next() 
    {
        if(this.length)
            this._handle(this.#queue.shift());
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
        if(this.#coldBoot)
        {
            this.next();
            this.#coldBoot = false;
        }
        return promise;
    }
};

module.exports = Q;
