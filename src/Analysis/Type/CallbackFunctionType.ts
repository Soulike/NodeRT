// DO NOT INSTRUMENT

import TimerCallbackFunctionType from './TimerCallbackFunctionType';
import ProcessCallbackFunctionType from './ProcessCallbackFunctionType';
import EventEmitterCallbackFunctionType from './EventEmitterCallbackFunctionType';
import PromiseCallbackFunctionType from './PromiseCallbackFunctionType';
import ChildProcessCallbackFunctionType from './ChildProcessCallbackFunctionType';
import ClusterCallbackFunctionType from './ClusterCallbackFunctionType';

type CallbackFunctionType =
    'global'
    | 'awaitContinue'
    | TimerCallbackFunctionType
    | ProcessCallbackFunctionType
    | EventEmitterCallbackFunctionType
    | PromiseCallbackFunctionType
    | ChildProcessCallbackFunctionType
    | ClusterCallbackFunctionType;

export default CallbackFunctionType;