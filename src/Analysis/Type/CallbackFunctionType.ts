// DO NOT INSTRUMENT

export type CallbackFunctionType =
    'global'
    | 'immediate'
    | 'timeout'
    | 'interval'
    | 'nextTick'
    | 'promiseThen'
    | 'eventListener'
    | 'eventListenerOnce'
    | 'awaitContinue';