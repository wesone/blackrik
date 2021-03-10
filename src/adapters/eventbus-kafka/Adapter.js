const EventBusAdapterInterface = require('../EventBusAdapterInterface');

const {Kafka} = require('kafkajs');

class Adapter extends EventBusAdapterInterface
{
    listeners = {};
    producer;
    consumer;

    constructor(args)
    {
        super();
        this.args = args;
        this.validateArgs();
    }

    validateArgs()
    {
        if(!this.args)
            throw Error('EventBus-Kafka needs arguments.');
        if(!this.args.host)
            throw Error('EventBus-Kafka missing argument: host.');
        if(!this.args.port)
            throw Error('EventBus-Kafka missing argument: port.');
    }

    addListener(type, listener)
    {
        if(this.listeners[type] === undefined)
            this.listeners[type] = [];
        this.listeners[type].push(listener);
    }

    executeListeners(type)
    {
        //TODO execute all listeners of 'type'
    }

    onMessage({ message })
    {
        console.log(`received message: ${message.value}`);
        // this.executeListeners(type);
    }

    async init()
    {
        const clientId = 'test'; //TODO construct clientid
        const brokers = [`${this.args.host}:${this.args.port}`];
        const kafka = new Kafka({clientId, brokers});

        this.producer = kafka.producer();
        await this.producer.connect();

        this.consumer = kafka.consumer({groupId: clientId});
        await this.consumer.connect();
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

        this.addListener(type, callback);
        await this.consumer.subscribe({topic: type});
    }

    async publish(event)
    {
        try
        {
            //TODO test this
            await this.producer.send({
                topic,
                messages: [
                    {
                        key: '1234',
                        value: 'this is a message',
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
