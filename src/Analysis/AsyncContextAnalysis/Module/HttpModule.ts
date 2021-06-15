// DO NOT INSTRUMENT

import CallbackFunction from '../../Class/CallbackFunction';
import SourceCodeInfo from '../../Class/SourceCodeInfo';
import CallbackFunctionContext from '../../Singleton/CallbackFunctionContext';
import HttpCallbackFunctionType from '../../Type/HttpCallbackFunctionType';
import http from 'http';

class HttpModule
{
    public static runHooks(f: Function, args: unknown[], currentCallbackFunction: CallbackFunction, sourceCodeInfo: SourceCodeInfo)
    {
        if (args.length > 0)
        {
            let type: null | HttpCallbackFunctionType = null;

            // @ts-ignore d.ts problem
            if (f === http.Agent.prototype.createConnection)
            {
                type = 'httpAgent';
            }
            else if (f === http.ClientRequest.prototype.end || f === http.ClientRequest.prototype.setTimeout || f === http.ClientRequest.prototype.write)
            {
                type = 'httpRequest';
            }
            else if (f === http.Server.prototype.close || f === http.Server.prototype.setTimeout)
            {
                type = 'httpServer';
            }
            else if (f === http.ServerResponse.prototype.end || f === http.ServerResponse.prototype.setTimeout || f === http.ServerResponse.prototype.write)
            {
                type = 'httpResponse';
            }
            else if (f === http.IncomingMessage.prototype.setTimeout)
            {
                type = 'httpIncomingMessage';
            }
            else if (f === http.OutgoingMessage.prototype.end || f === http.OutgoingMessage.prototype.setTimeout || f === http.OutgoingMessage.prototype.write)
            {
                type = 'httpOutgoingMessage';
            }
            else if (f === http.get || f === http.request)
            {
                type = 'httpGet';
            }

            if (type !== null)
            {
                const callback = args[args.length - 1];
                if (typeof callback === 'function' || callback instanceof Function)
                {
                    CallbackFunctionContext.pushToPendingCallbackFunctions(new CallbackFunction(callback, type, currentCallbackFunction, null, null, sourceCodeInfo));
                }
            }
        }
    }
}

export default HttpModule;