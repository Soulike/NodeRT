// DO NOT INSTRUMENT

import dns from 'dns';
import CallbackFunction from '../../Class/CallbackFunction';
import SourceCodeInfo from '../../Class/SourceCodeInfo';
import CallbackFunctionContext from '../../Singleton/CallbackFunctionContext';
import DnsCallbackFunctionType from '../../Type/DnsCallbackFunctionType';

class DnsModule
{
    public static runHooks(f: Function, args: unknown[], currentCallbackFunction: CallbackFunction, sourceCodeInfo: SourceCodeInfo)
    {
        if (args.length > 1)
        {
            let type: null | DnsCallbackFunctionType = null;

            if (f == dns.lookup || f === dns.lookupService
                || f === dns.resolve || f === dns.resolve4 || f === dns.resolve6
                || f === dns.resolveAny || f === dns.resolveCname
                // @ts-ignore added in Node.js 15
                || f === dns.resolveCaa
                || f === dns.resolveMx || f === dns.resolveNaptr || f === dns.resolveNs || f === dns.resolveSoa || f === dns.resolveSrv || f === dns.resolveTxt
                || f === dns.reverse)
            {
                type = 'dns';
            }
            {
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
}

export default DnsModule;