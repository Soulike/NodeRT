type CallbackType =
    'global'
    | 'immediate'
    | 'timeout'
    | 'interval'
    | 'nextTick'
    | 'promiseThen'
    | 'eventListener'
    | 'eventListenerOnce';

export default CallbackType;