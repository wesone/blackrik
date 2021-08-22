class Q
{
    #queue = [];
    #chain = Promise.resolve();
    #resetChain = false;

    get length()
    {
        return this.#queue.length;
    }

    _resetChain()
    {
        this.#resetChain = false;
        this.#chain = Promise.resolve();
        for(const generator of this.#queue)
            this._process(generator);
        return this.#chain;
    }

    _process(generator) 
    {
        return this.#chain = this.#chain
            .then(() => generator())
            .then(value => this.#queue.shift() && value)
            .catch(e => {
                this.#resetChain = true;
                throw e;
            });
    }

    add(generator)
    {
        if(typeof generator !== 'function')
            throw Error('Parameter needs to be of type function.');
        
        if(this.#resetChain)
            return this._resetChain();

        this.#queue.push(generator);
        return this._process(generator);
    }
}

module.exports = Q;
