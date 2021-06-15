// DO NOT INSTRUMENT

import CallbackFunction from '../../Class/CallbackFunction';
import SourceCodeInfo from '../../Class/SourceCodeInfo';
import CallbackFunctionContext from '../../Singleton/CallbackFunctionContext';
import CryptoCallbackFunctionType from '../../Type/CryptoCallbackFunctionType';
import crypto from 'crypto';

class ClusterModule
{
    public static runHooks(f: Function, args: unknown[], currentCallbackFunction: CallbackFunction, sourceCodeInfo: SourceCodeInfo)
    {
        if (args.length > 1)
        {
            let type: null | CryptoCallbackFunctionType = null;
            // @ts-ignore
            // some new api added in Node.js 15
            if (f === crypto.checkPrime || f === crypto.generateKey || f === crypto.generateKeyPair || f === crypto.generatePrime || f === crypto.hkdf || f === crypto.pbkdf2
                || f === crypto.randomBytes || f === crypto.randomFill || f === crypto.randomInt
                || f === crypto.scrypt || crypto.sign || crypto.verify)
            {
                type = 'crypto';
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

export default ClusterModule;