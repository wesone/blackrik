const EventBusAdapterInterface = require('../EventBusAdapterInterface');

const {Kafka, logLevel} = require('kafkajs');
const ConsumerList = require('./ConsumerList');

class Adapter extends EventBusAdapterInterface
{
    listeners;
    producer;
    consumer;

    constructor(args)
    {
        super();
        this.args = {...args};
        this.validateArgs();
        this.listeners = new ConsumerList();
    }

    validateArgs()
    {
        if(!this.args)
            throw Error('EventBus-Kafka needs arguments.');
        if(!this.args.brokers || !Array.isArray(this.args.brokers) || !this.args.brokers.length)
            throw Error('EventBus-Kafka please provide at least one broker inside the \'brokers\' array.');
    }

    onMessage({topic, /* partition, */ message})
    {
        const event = JSON.parse(message.value.toString());
        this.listeners.execute(event.type, event);
    }

    async init()
    {
        const kafka = new Kafka({
            logLevel: logLevel.ERROR,
            ...this.args
        });

        this.producer = kafka.producer();
        await this.producer.connect();

        this.consumer = kafka.consumer({groupId: this.args.clientId});
    }

    async start()
    {
        await this.consumer.connect(); // connect the client after all topics were created
        
        await this.consumer.run({
            // eachBatch: async ({ batch }) => {},
            eachMessage: this.onMessage.bind(this)
        });
    }

    async subscribe(name, type, callback)
    {
        if(typeof name !== 'string')
            throw Error(`First parameter of subscribe needs to be of type string (given type: ${typeof type}).`);
        if(typeof type !== 'string')
            throw Error(`Second parameter of subscribe needs to be of type string (given type: ${typeof type}).`);
        if(typeof callback !== 'function')
            throw Error(`Third parameter of subscribe needs to be of type function (given type: ${typeof callback}).`);

        this.listeners.add(type, callback);
        await this.consumer.subscribe({topic: name});
    }

    async publish(name, event)
    {
        try
        {
            await this.producer.send({
                topic: name,
                messages: [
                    {
                        // key: '1234',
                        value: JSON.stringify(event)
                    }
                ]
            });
            return true;
        }
        catch(err)
        {
            console.error('Could not publish event...', err);
            return false;
        }
    }
}

module.exports = Adapter;
