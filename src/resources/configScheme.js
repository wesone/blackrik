const yup = require('yup');

const FunctionScheme = require('./YupExtensions/FunctionScheme');
yup.function = () => new FunctionScheme();

const MiddlewareScheme = require('./YupExtensions/MiddlewareScheme');
yup.middleware = () => new MiddlewareScheme();

const AdapterListScheme = require('./YupExtensions/AdapterListScheme');
yup.adapterList = () => new AdapterListScheme();

const httpMethods = require('./httpMethods');
const {ROUTE_COMMAND, ROUTE_QUERY} = require('../core/Constants');
const reservedRoutes = [ROUTE_COMMAND, ROUTE_QUERY]; // this would allow /query/:rm/:res :(

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
            source: yup.object({
                handlers: yup.object().required(),
                sideEffects: yup.object().required()
            }),
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
