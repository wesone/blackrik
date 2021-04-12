const Workflow = require('../../../src/workflow');
const {USER_CREATED, USER_UPDATED, USER_REJECTED, USER_MAIL_CHANGE_REVERTED} = require('../events/users');

function saveEmailAddress(workflow)
{
    workflow.context.oldEmail = workflow.currentEvent.payload.email;
}

function updateMail(workflow)
{
    if(workflow.context.changeCount > 0)
    {
        const state = workflow.history.pop();
        if(state.event.type === USER_UPDATED)
        {
            workflow.context.oldEmail = state.event.payload.email;
        }
    }
}

async function sendConfirmationMail(workflow)
{
    if(workflow.context.oldEmail === workflow.currentEvent.payload.email)
        return;

    workflow.context.changeCount ++;
    console.log('Send mail with restore link to:', workflow.context.oldEmail);
}

async function restoreEmailAddress(workflow)
{
    await workflow.sideEffects.executeCommand({
        aggregateName: 'user',
        aggregateId: workflow.currentEvents.aggregateId,
        type: 'update',
        payload: {
            email: workflow.context.oldEmail
        }
    });
    console.log('Send Success mail to:', workflow.context.oldEmail);
    
}


const mailChangeWorkflow = new Workflow({
    name: 'UserEmailChange',
    version: 1,
    initial: 'init',
    context: { changeCount: 0 },
    steps: {
        init:{
            on: {
                [USER_CREATED]: 'newUser'
            }
        },
        newUser: {
            actions: [saveEmailAddress],
            on: {
                [USER_UPDATED]: 'change',
                [USER_REJECTED]: 'done',
            }
        },
        change: {
            actions: [updateMail,sendConfirmationMail],
            on: {
                [USER_UPDATED]: 'change',
                [USER_MAIL_CHANGE_REVERTED]: 'restore',
                [USER_REJECTED]: 'done',
            }
        },
        restore: {
            actions: [restoreEmailAddress],
            on: {
                [USER_REJECTED]: 'done',
                [USER_UPDATED]: 'change',
            }
        },
    }
});

module.exports = mailChangeWorkflow.connect();

