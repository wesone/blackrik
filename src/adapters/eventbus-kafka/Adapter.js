const EventBusAdapterInterface = require('../EventBusAdapterInterface');

const {Kafka} = require('kafkajs');
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
        this.listeners.execute(topic, event);
    }

    async init()
    {
        this.args.clientId = this.args.clientId || 'blackrik-application';
        const kafka = new Kafka(this.args);

        this.producer = kafka.producer();
        await this.producer.connect();

        this.consumer = kafka.consumer({groupId: this.args.clientId});
        await this.consumer.connect();
    }

    async start()
    {
        await this.consumer.run({
            eachMessage: this.onMessage.bind(this)
        });
    }

    async subscribe(type, callback)
    {
        if(typeof type !== 'string')
            throw Error(`First parameter of subscribe needs to be of type string (given type: ${typeof type}).`);
        if(typeof callback !== 'function')
        throw Error(`Second parameter of subscribe needs to be of type function (given type: ${typeof callback}).`);

        this.listeners.add(type, callback);
        await this.consumer.subscribe({topic: type});
    }

    async publish(event)
    {
        try
        {
            await this.producer.send({
                topic: event.type,
                messages: [
                    {
                        // key: '1234',
                        value: JSON.stringify(event)
                    }
                ]
            });
        }
        catch(err)
        {
			console.error('Could not publish event...', err);
		}
    }
}

module.exports = Adapter;
