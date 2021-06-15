// DO NOT INSTRUMENT

import CallbackFunction from '../../Class/CallbackFunction';
import SourceCodeInfo from '../../Class/SourceCodeInfo';
import {strict as assert} from 'assert';
import CallbackFunctionContext from '../../Singleton/CallbackFunctionContext';
import PromiseTree from '../../Type/PromiseTree';

class PromiseModule
{
    public static runHooks(f: Function, base: unknown, args: unknown[], result: unknown, currentCallbackFunction: CallbackFunction, sourceCodeInfo: SourceCodeInfo)
    {
        if (args.length > 0)
        {
            if (f === Promise.prototype.then)
            {
                assert.ok(base instanceof Promise);
                assert.ok(result instanceof Promise);

                const registerPromise = base as PromiseTree;
                const resultPromise = result as PromiseTree;

                registerPromise.children === undefined ? registerPromise.children = [resultPromise] : registerPromise.children.push(resultPromise);
                resultPromise.parent = registerPromise;

                const resolve = args[0];
                const reject = args[1];

                if (typeof resolve === 'function')
                {
                    const callback = new CallbackFunction(resolve, 'promiseThen', currentCallbackFunction, registerPromise, resultPromise, sourceCodeInfo);
                    CallbackFunctionContext.pushToPendingCallbackFunctions(callback);
                }

                if (typeof reject === 'function')
                {
                    const callback = new CallbackFunction(reject, 'promiseThen', currentCallbackFunction, registerPromise, resultPromise, sourceCodeInfo);
                    CallbackFunctionContext.pushToPendingCallbackFunctions(callback);
                }
            }
            else if (f === Promise.prototype.catch)
            {
                assert.ok(base instanceof Promise);
                assert.ok(result instanceof Promise);

                const registerPromise = base as PromiseTree;
                const resultPromise = result as PromiseTree;

                registerPromise.children === undefined ? registerPromise.children = [resultPromise] : registerPromise.children.push(resultPromise);
                resultPromise.parent = registerPromise;

                const reject = args[0];

                if (typeof reject === 'function')
                {
                    const callback = new CallbackFunction(reject, 'promiseThen', currentCallbackFunction, registerPromise, resultPromise, sourceCodeInfo);
                    CallbackFunctionContext.pushToPendingCallbackFunctions(callback);
                }
            }
            else if (f === Promise.prototype.finally)
            {
                assert.ok(base instanceof Promise);
                assert.ok(result instanceof Promise);

                const registerPromise = base as PromiseTree;
                const resultPromise = result as PromiseTree;

                registerPromise.children === undefined ? registerPromise.children = [resultPromise] : registerPromise.children.push(resultPromise);
                resultPromise.parent = registerPromise;

                const resolve = args[0];

                if (typeof resolve === 'function')
                {
                    const callback = new CallbackFunction(resolve, 'promiseThen', currentCallbackFunction, registerPromise, resultPromise, sourceCodeInfo);
                    CallbackFunctionContext.pushToPendingCallbackFunctions(callback);
                }
            }
        }
    }
}

export default PromiseModule;