// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import CallbackFunctionContext from '../../Singleton/CallbackFunctionContext';
import CallbackFunction from '../../Class/CallbackFunction';
import SourceCodeInfo from '../../Class/SourceCodeInfo';
import ProcessCallbackFunctionType from '../../Type/ProcessCallbackFunctionType';

class ProcessModule
{
    public static runHooks(f: Function, args: unknown[], currentCallbackFunction: CallbackFunction, sourceCodeInfo: SourceCodeInfo)
    {
        if (args.length > 0)
        {
            let type: null | ProcessCallbackFunctionType = null;
            if (f === process.nextTick)
            {
                type = 'nextTick';
            }

            if (type !== null)
            {
                const callback = args[0] as Function;
                assert.ok(typeof callback === 'function');
                CallbackFunctionContext.pushToPendingCallbackFunctions(new CallbackFunction(callback, type, currentCallbackFunction, null, null, sourceCodeInfo));
            }
        }
    }
}

export default ProcessModule;