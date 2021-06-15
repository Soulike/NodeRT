// DO NOT INSTRUMENT

import TimerCallbackFunctionType from './TimerCallbackFunctionType';
import ProcessCallbackFunctionType from './ProcessCallbackFunctionType';
import EventEmitterCallbackFunctionType from './EventEmitterCallbackFunctionType';
import PromiseCallbackFunctionType from './PromiseCallbackFunctionType';
import ChildProcessCallbackFunctionType from './ChildProcessCallbackFunctionType';
import ClusterCallbackFunctionType from './ClusterCallbackFunctionType';
import CryptoCallbackFunctionType from './CryptoCallbackFunctionType';
import DgramCallbackFunctionType from './DgramCallbackFunctionType';
import DnsCallbackFunctionType from './DnsCallbackFunctionType';
import FsCallbackFunctionType from './FsCallbackFunctionType';
import HttpCallbackFunctionType from './HttpCallbackFunctionType';

type CallbackFunctionType =
    'global'
    | 'awaitContinue'
    | TimerCallbackFunctionType
    | ProcessCallbackFunctionType
    | EventEmitterCallbackFunctionType
    | PromiseCallbackFunctionType
    | ChildProcessCallbackFunctionType
    | ClusterCallbackFunctionType
    | CryptoCallbackFunctionType
    | DgramCallbackFunctionType
    | DnsCallbackFunctionType
    | FsCallbackFunctionType
    | HttpCallbackFunctionType;

export default CallbackFunctionType;