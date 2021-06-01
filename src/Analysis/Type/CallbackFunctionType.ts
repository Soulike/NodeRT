// DO NOT INSTRUMENT

type CallbackFunctionType =
    'global'
    | 'immediate'
    | 'timeout'
    | 'interval'
    | 'nextTick'
    | 'promiseThen'
    | 'eventListener'
    | 'eventListenerOnce'
    | 'awaitContinue';

export default CallbackFunctionType;