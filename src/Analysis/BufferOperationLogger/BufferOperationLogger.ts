// DO NOT INSTRUMENT

import Analysis from '../../Type/Analysis';
import Sandbox from '../../Type/Sandbox';
import Hooks from '../../Type/Hooks';
import LastExpressionValueContainer from '../Singleton/LastExpressionValueContainer';
import {getSourceCodeInfoFromIid} from '../Util';
import CallbackFunctionContext from '../Singleton/CallbackFunctionContext';
import BufferLogger, {BufferOperation} from '../Singleton/BufferLogger';
import {strict as assert} from 'assert';

class BufferOperationLogger extends Analysis
{
    private static readonly constructionApis: Set<(...args: any[]) => Buffer> = new Set([
        Buffer.alloc,
        Buffer.allocUnsafe,
        Buffer.allocUnsafeSlow,
    ]);
    public invokeFun: Hooks['invokeFun'] | undefined;
    public forObject: Hooks['forObject'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks(): void
    {
        this.invokeFun = (iid, f, base, args, result, isConstructor, isMethod, functionIid, functionSid) =>
        {
            // @ts-ignore
            if (BufferOperationLogger.constructionApis.has(f))
            {
                assert.ok(Buffer.isBuffer(result));
                const bufferDeclaration = BufferLogger.getBufferDeclaration(result);
                bufferDeclaration.appendOperation(CallbackFunctionContext.getCurrentCallbackFunction(),
                    new BufferOperation('write', getSourceCodeInfoFromIid(iid, this.getSandbox())));
            }
            else if (f === Buffer || f === Buffer.from)
            {
                const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, this.getSandbox());
                if (Buffer.isBuffer(args[0]))
                {
                    const readBuffer = args[0];
                    const readBufferDeclaration = BufferLogger.getBufferDeclaration(readBuffer);
                    readBufferDeclaration.appendOperation(currentCallbackFunction,
                        new BufferOperation('read', sourceCodeInfo));
                }
                assert.ok(Buffer.isBuffer(result));
                const bufferDeclaration = BufferLogger.getBufferDeclaration(result);
                bufferDeclaration.appendOperation(currentCallbackFunction,
                    new BufferOperation('write', sourceCodeInfo));
            }
            else if (f === Buffer.compare)
            {
                const buffer1 = args[0] as Parameters<typeof Buffer.compare>[0];
                const buffer2 = args[1] as Parameters<typeof Buffer.compare>[1];
                const buffer1Declaration = BufferLogger.getBufferDeclaration(buffer1);
                const buffer2Declaration = BufferLogger.getBufferDeclaration(buffer2);
                const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, this.getSandbox());
                buffer1Declaration.appendOperation(currentCallbackFunction,
                    new BufferOperation('read', sourceCodeInfo));
                buffer2Declaration.appendOperation(currentCallbackFunction,
                    new BufferOperation('read', sourceCodeInfo));
            }
            else if (f === Buffer.concat)
            {
                const list = args[0] as Parameters<typeof Buffer.concat>[0];
                const returnedBuffer = result as ReturnType<typeof Buffer.concat>;
                const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, this.getSandbox());
                for (const buffer of list)
                {
                    const bufferDeclaration = BufferLogger.getBufferDeclaration(buffer);
                    bufferDeclaration.appendOperation(currentCallbackFunction, new BufferOperation('read', sourceCodeInfo));
                }
                const returnedBufferDeclaration = BufferLogger.getBufferDeclaration(returnedBuffer);
                returnedBufferDeclaration.appendOperation(currentCallbackFunction, new BufferOperation('write', sourceCodeInfo));
            }
        };

        this.forObject = (iid, isForIn) =>
        {
            const lastExpressionValue = LastExpressionValueContainer.getLastExpressionValue();
            if (!isForIn && Buffer.isBuffer(lastExpressionValue))
            {
                const sandbox = this.getSandbox();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);

                const bufferDeclaration = BufferLogger.getBufferDeclaration(lastExpressionValue);
                bufferDeclaration.appendOperation(CallbackFunctionContext.getCurrentCallbackFunction(), new BufferOperation('read', sourceCodeInfo));
            }
        };
    }
}

export default BufferOperationLogger;