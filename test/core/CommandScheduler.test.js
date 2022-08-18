const CommandScheduler = require('../../src/core/CommandScheduler');
const Store = require('../_mock/ReadModelStore');
const {COMMAND_SCHEDULER_TABLE_NAME: CommandSchedulerStoreTable} = require('../../src/core/Constants');

const command = {
    aggregateName: 'testAggregate',
    aggregateId: '0648b417-80c7-42ca-a027-9efe08bc00c4',
    type: 'testCommand'
};
const causationEvent = {value: 'causationEvent'};

let executor;
let store;
let scheduler;
beforeEach(async () => {
    executor = jest.fn(() => {});
    store = new Store();
    scheduler = new CommandScheduler(executor, store);
    await scheduler.init();
});

test('rejects invalid timestamps and commands', async () => {
    expect(await scheduler.process(Date.now()-1, {}, causationEvent)).toBe(false);
    expect(await scheduler.process('invalid', command, causationEvent)).toBe(false);
    expect(executor).toHaveBeenCalledTimes(0);
});

test('instantly executes scheduled commands from the past', async () => {
    expect(await scheduler.process(Date.now()-1, command, causationEvent)).not.toBe(false);
    expect(executor).toHaveBeenCalledTimes(1);
    expect(executor).toHaveBeenNthCalledWith(1, command, causationEvent);
    expect(store.insert).toHaveBeenCalledTimes(0);
});

test('schedules commands and persists them', async () => {
    const msToWait = 5;
    await scheduler.process(Date.now()+msToWait, command, causationEvent);
    await new Promise(resolve => setTimeout(resolve, msToWait+3));

    expect(executor).toHaveBeenCalledTimes(1);
    expect(executor).toHaveBeenNthCalledWith(1, command, causationEvent);
    expect(store.insert).toHaveBeenCalledTimes(1);
    expect(store.delete).toHaveBeenCalledTimes(1);
});

test('execution can be stopped', async () => {
    const msToWait = 4;
    await scheduler.process(Date.now()+msToWait, command, causationEvent);
    scheduler.stop();
    await new Promise(resolve => setTimeout(resolve, msToWait+3));

    expect(executor).toHaveBeenCalledTimes(0);
    expect(store.insert).toHaveBeenCalledTimes(1);
    expect(store.delete).toHaveBeenCalledTimes(0);
});

test('loads scheduled commands and processes them', async () => {
    const msToWait = 4;
    await scheduler.process(Date.now()+msToWait, command, causationEvent);
    await scheduler.process(Date.now()+msToWait, command, causationEvent);
    scheduler.stop();

    expect(executor).toHaveBeenCalledTimes(0);
    expect(store.insert).toHaveBeenCalledTimes(2);
    expect(store.delete).toHaveBeenCalledTimes(0);

    scheduler = new CommandScheduler(executor, store);
    await scheduler.init();
    await new Promise(resolve => setTimeout(resolve, msToWait+3));

    expect(executor).toHaveBeenCalledTimes(2);
    expect(store.insert).toHaveBeenCalledTimes(2);
    expect(store.delete).toHaveBeenCalledTimes(2);
});

test('does not execute persisted scheduled commands that were already handled', async () => {
    const msToWait = 4;
    await scheduler.process(Date.now()+msToWait, command, causationEvent);
    await scheduler.process(Date.now()+msToWait, command, causationEvent);
    await store.delete(CommandSchedulerStoreTable);
    await new Promise(resolve => setTimeout(resolve, msToWait+3));

    expect(executor).toHaveBeenCalledTimes(0);
    expect(store.insert).toHaveBeenCalledTimes(2);
    expect(store.delete).toHaveBeenCalledTimes(3);
});
