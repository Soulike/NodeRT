// DO NOT INSTRUMENT

import CallbackFunction from '../../Class/CallbackFunction';
import SourceCodeInfo from '../../Class/SourceCodeInfo';
import {strict as assert} from 'assert';
import CallbackFunctionContext from '../../Singleton/CallbackFunctionContext';
import http2 from 'http2';
import Http2CallbackFunctionType from '../../Type/Http2CallbackFunctionType';

class Http2Module
{
    public static runHooks(f: Function, args: unknown[], currentCallbackFunction: CallbackFunction, sourceCodeInfo: SourceCodeInfo)
    {
        if (args.length > 0)
        {
            let type: null | Http2CallbackFunctionType = null;

            const server = http2.createServer();
            const http2Server = Object.getPrototypeOf(server);
            const secureServer = http2.createSecureServer();
            const http2SecureServer = Object.getPrototypeOf(secureServer);

            const session = http2.connect('https://cn.bing.com');
            session.close();
            const http2Session = Object.getPrototypeOf(session);

            // lack of ServerHttp2Stream
            if (f === http2Server.close || f === http2Server.setTimeout)
            {
                type = 'http2Server';
            }
            else if (f === http2SecureServer.close || f === http2SecureServer.setTimeout)
            {
                type = 'http2SecureServer';
            }
            else if (f === http2Session.close || f === http2Session.ping || f === http2Session.setTimeout || f === http2Session.settings)
            {
                type = 'http2Session';
            }
            if (f === http2.Http2ServerRequest.prototype.setTimeout)
            {
                type = 'http2ServerRequest';
            }
            else if (f === http2.Http2ServerResponse.prototype.createPushResponse || f === http2.Http2ServerResponse.prototype.end || f === http2.Http2ServerResponse.prototype.setTimeout || f === http2.Http2ServerResponse.prototype.write)
            {
                type = 'http2ServerResponse';
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

export default Http2Module;