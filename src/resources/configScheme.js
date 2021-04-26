const yup = require('yup');

const FunctionScheme = require('./YupExtensions/FunctionScheme');
yup.function = () => new FunctionScheme();

const MiddlewareScheme = require('./YupExtensions/MiddlewareScheme');
yup.middleware = () => new MiddlewareScheme();

const AdapterListScheme = require('./YupExtensions/AdapterListScheme');
yup.adapterList = () => new AdapterListScheme();

const httpMethods = require('./httpMethods');
const reservedRoutes = Object.values(require('../core/Constants').ROUTES); // this would allow /query/:rm/:res :(

const sagaSource = yup.object({
    handlers: yup.object().required(),
    sideEffects: yup.object().required()
});
const sagaSourceWorkflow = yup.object({
    name: yup.string().required(),
    version: yup.number(),
    initial: yup.string().required(),
    context: yup.object(),
    steps: yup.object().required()
});

module.exports = yup.object({
    aggregates: yup.array(
        yup.object({
            name: yup.string().required(),
            commands: yup.object().required(),
            projection: yup.object()
        })
    ),
    readModels: yup.array(
        yup.object({
            name: yup.string().required(),
            projection: yup.object(),
            resolvers: yup.object(),
            adapter: yup.string()
        })
    ),
    sagas: yup.array(
        yup.object({
            name: yup.string().required(),
            source: yup.mixed().test(
                'shape',
                'invalid',
                data => 
                    sagaSource.isValidSync(data) ||
                    sagaSourceWorkflow.isValidSync(data)
            ),
            adapter: yup.string()
        })
    ),
    adapter: yup.string(),
    readModelStoreAdapters: yup.adapterList(), // object with each value matches {module: string (required), args: object (optional)}
    eventStoreAdapter: yup.object({
        module: yup.string().required(),
        args: yup.object()
    }),
    eventBusAdapter: yup.object({
        module: yup.string().required(),
        args: yup.object()
    }),
    contextProvider: yup.function(),
    server: yup.object({
        config: yup.object({
            port: yup.number().positive().integer(),
            skipDefaultMiddlewares: yup.boolean()
        }),
        middlewares: yup.array(
            yup.middleware() // function or array(string, ...functions)
        ),
        routes: yup.array(
            yup.object({
                method: yup.string().lowercase().oneOf(httpMethods).required(),
                path: yup.string().notOneOf(reservedRoutes).required(),
                callback: yup.function().required()
            })
        )
    })
});
