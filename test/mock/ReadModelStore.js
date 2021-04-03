class ReadModelStore
{
    constructor()
    {
        this.tables = {};

        this.insert = jest.fn(this._insert);
        this.update = jest.fn(this._update);
        this.delete = jest.fn(this._delete);
        this.find = jest.fn(this._find);
    }

    async defineTable(table, scheme)
    {
        const schemeRepresentation = JSON.stringify(scheme);
        if(!this.tables[table] || this.tables[table].scheme !== schemeRepresentation)
        {
            this.tables[table] = {
                scheme: schemeRepresentation,
                data: []
            };
            return true;
        }
        return false;
    }

    async _insert(table, data)
    {
        if(!this.tables[table] || !this.tables[table])
            return false;
        this.tables[table].data.push(data);
        return true;
    }

    async _update(){}

    async _delete(table, conditions = null)
    {
        if(!this.tables[table] || !this.tables[table].data.length)
            return 0;
        if(!conditions)
            return this.tables[table].data.splice(0).length;

        //TODO implement complex conditions
        const filter = Object.entries(conditions);
        let removeCount = 0;
        for(let i = 0; i < this.tables[table].data.length; i++)
        {
            const data = this.tables[table].data[i];
            let remove = true;
            for(const [prop, value] of filter)
                if(data[prop] !== value)
                    remove = false;
            if(remove)
            {
                removeCount += this.tables[table].data.splice(i, 1).length;
                i--;
            }
        }
        return removeCount;
    }

    async _find(table, conditions = null, options = {})
    {
        if(!this.tables[table] || !this.tables[table].data.length)
            return [];

        //TODO implement conditions if needed

        const entries = !conditions
            ? [...this.tables[table].data]
            : [];
        
        if(options.sort)
            entries.sort((a, b) => {
                for(const [prop, dir] of options.sort)
                {
                    if(a[prop] < b[prop])
                        return dir === 'asc' ? -1 : 1;
                    if(a[prop] > b[prop])
                        return dir === 'asc' ? 1 : -1;
                }
                return 0;
            });

        return entries;
    }
}

module.exports = ReadModelStore;
