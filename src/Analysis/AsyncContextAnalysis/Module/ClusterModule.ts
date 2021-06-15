// DO NOT INSTRUMENT

import CallbackFunction from '../../Class/CallbackFunction';
import SourceCodeInfo from '../../Class/SourceCodeInfo';
import {strict as assert} from 'assert';
import CallbackFunctionContext from '../../Singleton/CallbackFunctionContext';
import ClusterCallbackFunctionType from '../../Type/ClusterCallbackFunctionType';
import cluster from 'cluster';

class ClusterModule
{
    public static runHooks(f: Function, args: unknown[], currentCallbackFunction: CallbackFunction, sourceCodeInfo: SourceCodeInfo)
    {
        if (args.length > 0)
        {
            let type: null | ClusterCallbackFunctionType = null;

            if (f === cluster.Worker.prototype.send)
            {
                type = 'clusterSend';
            }
            if (f === cluster.disconnect)
            {
                type = 'clusterDisconnect';
            }

            if (type !== null)
            {
                const callback = args[args.length - 1] as Function;
                assert.ok(typeof callback === 'function');
                CallbackFunctionContext.pushToPendingCallbackFunctions(new CallbackFunction(callback, type, currentCallbackFunction, null, null, sourceCodeInfo));
            }
        }
    }
}

export default ClusterModule;