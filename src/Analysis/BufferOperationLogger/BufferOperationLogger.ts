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
    public invokeFun: Hooks['invokeFun'] | undefined;
    public forObject: Hooks['forObject'] | undefined;
    public getField: Hooks['getField'] | undefined;
    public putFieldPre: Hooks['putFieldPre'] | undefined;

    private static readonly constructionApis: Set<(...args: any[]) => Buffer> = new Set([
        Buffer.alloc,
        Buffer.allocUnsafe,
        Buffer.allocUnsafeSlow,
    ]);

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
                this.appendBufferOperation(result, 'write', iid);
            }
            // TODO: 数组版本的处理
            else if (f === Buffer || f === Buffer.from)
            {
                if (args[0] instanceof Uint8Array)
                {
                    const readBuffer = args[0];
                    this.appendBufferOperation(readBuffer, 'read', iid);
                }
                assert.ok(Buffer.isBuffer(result));
                this.appendBufferOperation(result, 'write', iid);
            }
            else if (f === Buffer.compare)
            {
                const buffer1 = args[0] as Parameters<typeof Buffer.compare>[0];
                const buffer2 = args[1] as Parameters<typeof Buffer.compare>[1];
                this.appendBufferOperation(buffer1, 'read', iid);
                this.appendBufferOperation(buffer2, 'read', iid);
            }
            else if (f === Buffer.concat)
            {
                const list = args[0] as Parameters<typeof Buffer.concat>[0];
                const returnedBuffer = result as ReturnType<typeof Buffer.concat>;
                for (const buffer of list)
                {
                    this.appendBufferOperation(buffer, 'read', iid);
                }
                this.appendBufferOperation(returnedBuffer, 'write', iid);
            }
        };

        this.forObject = (iid, isForIn) =>
        {
            const lastExpressionValue = LastExpressionValueContainer.getLastExpressionValue();
            if (!isForIn && Buffer.isBuffer(lastExpressionValue))
            {
                this.appendBufferOperation(lastExpressionValue, 'read', iid);
            }
        };

        this.getField = (iid, base, offset, val, isComputed, isOpAssign, isMethodCall) =>
        {
            if (base instanceof Uint8Array)
            {
                this.appendBufferOperation(base, 'read', iid);
            }
        };

        this.putFieldPre = (iid, base, offset, val, isComputed, isOpAssign) =>
        {
            if (base instanceof Uint8Array)
            {
                this.appendBufferOperation(base, 'write', iid);
            }
        };
    }

    private appendBufferOperation(buffer: Buffer | Uint8Array, type: 'read' | 'write', iid: number)
    {
        const bufferDeclaration = BufferLogger.getBufferDeclaration(buffer);
        bufferDeclaration.appendOperation(CallbackFunctionContext.getCurrentCallbackFunction(),
            new BufferOperation('write', getSourceCodeInfoFromIid(iid, this.getSandbox())));
    }
}

export default BufferOperationLogger;