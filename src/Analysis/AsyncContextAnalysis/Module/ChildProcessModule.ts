// DO NOT INSTRUMENT

import CallbackFunction from '../../Class/CallbackFunction';
import SourceCodeInfo from '../../Class/SourceCodeInfo';
import CallbackFunctionContext from '../../Singleton/CallbackFunctionContext';
import ChildProcessCallbackFunctionType from '../../Type/ChildProcessCallbackFunctionType';
import childProcess from 'child_process';

class ChildProcessModule
{
    public static runHooks(f: Function, args: unknown[], currentCallbackFunction: CallbackFunction, sourceCodeInfo: SourceCodeInfo)
    {
        if (args.length > 1)
        {
            let type: null | ChildProcessCallbackFunctionType = null;
            const subprocess = childProcess.spawn('echo 1', {shell: true, windowsHide: true});  // for getting ChildProcess.send()
            if (f === childProcess.exec || f === childProcess.execFile)
            {
                type = 'childProcess';
            }
            else if (f === subprocess.send)
            {
                type = 'childProcessSend';
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

export default ChildProcessModule;