// DO NOT INSTRUMENT

import CallbackFunction from '../../Class/CallbackFunction';
import SourceCodeInfo from '../../Class/SourceCodeInfo';
import {strict as assert} from 'assert';
import TimerCallbackFunctionType from '../../Type/TimerCallbackFunctionType';
import CallbackFunctionContext from '../../Singleton/CallbackFunctionContext';

class TimerModule
{
    public static runHooks(f: Function, args: unknown[], currentCallbackFunction: CallbackFunction, sourceCodeInfo: SourceCodeInfo)
    {
        let type: null | TimerCallbackFunctionType = null;
        if (f === setTimeout)
        {
            type = 'timeout';
        }
        else if (f === setImmediate)
        {
            type = 'immediate';
        }
        else if (f === setInterval)
        {
            type = 'interval';
        }

        if (type !== null)
        {
            const callback = args[0] as Function;
            assert.ok(typeof callback === 'function');
            CallbackFunctionContext.pushToPendingCallbackFunctions(new CallbackFunction(callback, type, currentCallbackFunction, null, null, sourceCodeInfo));
        }
    }
}

export default TimerModule;