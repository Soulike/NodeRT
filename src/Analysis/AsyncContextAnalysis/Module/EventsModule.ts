// DO NOT INSTRUMENT

import CallbackFunction from '../../Class/CallbackFunction';
import SourceCodeInfo from '../../Class/SourceCodeInfo';
import {strict as assert} from 'assert';
import CallbackFunctionContext from '../../Singleton/CallbackFunctionContext';
import EventEmitterCallbackFunctionType from '../../Type/EventEmitterCallbackFunctionType';
import EventEmitter from 'events';

class EventsModule
{
    public static runHooks(f: Function, args: unknown[], currentCallbackFunction: CallbackFunction, sourceCodeInfo: SourceCodeInfo)
    {
        if (args.length > 1)
        {
            let type: null | EventEmitterCallbackFunctionType = null;

            if (f === EventEmitter.prototype.on || f === EventEmitter.prototype.addListener || f === EventEmitter.prototype.prependListener)
            {
                type = 'eventListener';
            }
            else if (f === EventEmitter.prototype.once || f === EventEmitter.prototype.prependOnceListener)
            {
                type = 'eventListenerOnce';
            }

            if (type !== null)
            {
                const callback = args[1] as Function;
                assert.ok(typeof callback === 'function');
                CallbackFunctionContext.pushToPendingCallbackFunctions(new CallbackFunction(callback, type, currentCallbackFunction, null, null, sourceCodeInfo));
            }
        }
    }
}

export default EventsModule;