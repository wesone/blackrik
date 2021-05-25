class Q
{
    #queue = [];
    #chain = Promise.resolve();

    get length()
    {
        return this.#queue.length;
    }

    _process(generator) 
    {
        return this.#chain = this.#chain
            .then(() => generator())
            .then(value => this.#queue.shift() && value);
    }

    add(generator)
    {
        if(typeof generator !== 'function')
            throw Error('Parameter needs to be of type function.');
        
        this.#queue.push(generator);
        return this._process(generator);
    }
};

module.exports = Q;
