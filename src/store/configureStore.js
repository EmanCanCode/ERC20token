import { createStore, applyMiddleware, compose } from 'redux'
import { createLogger } from 'redux-logger'
import rootReducer from "./reducers"

const loggerMiddleware = createLogger()
const middleware = []

// For Redux Dev Tools
const compostEnhancers = window._REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export default function configureStore(preloadedState) {
    return createStore(
        rootReducer,
        preloadedState,
        compostEnhancers(applyMiddleware(...middleware, loggerMiddleware))
    )
}