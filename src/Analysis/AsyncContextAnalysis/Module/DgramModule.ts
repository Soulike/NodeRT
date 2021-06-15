// DO NOT INSTRUMENT

import dgram from 'dgram';
import CallbackFunction from '../../Class/CallbackFunction';
import SourceCodeInfo from '../../Class/SourceCodeInfo';
import CallbackFunctionContext from '../../Singleton/CallbackFunctionContext';
import DgramCallbackFunctionType from '../../Type/DgramCallbackFunctionType';

class DgramModule
{
    public static runHooks(f: Function, args: unknown[], currentCallbackFunction: CallbackFunction, sourceCodeInfo: SourceCodeInfo)
    {
        let type: null | DgramCallbackFunctionType = null;

        if (f === dgram.Socket.prototype.bind)
        {
            type = 'dgramBind';
        }
        else if (f === dgram.Socket.prototype.close)
        {
            type = 'dgramClose';
        }
        else if (f === dgram.Socket.prototype.connect)
        {
            type = 'dgramConnect';
        }
        else if (f === dgram.Socket.prototype.send)
        {
            type = 'dgramSend';
        }
        else if (f === dgram.createSocket)
        {
            type = 'dgramCreateSocket';
        }

        if (type !== null && args.length > 0)
        {
            const callback = args[args.length - 1];
            if (typeof callback === 'function' || callback instanceof Function)
            {
                CallbackFunctionContext.pushToPendingCallbackFunctions(new CallbackFunction(callback, type, currentCallbackFunction, null, null, sourceCodeInfo));
            }
        }
    }
}

export default DgramModule;