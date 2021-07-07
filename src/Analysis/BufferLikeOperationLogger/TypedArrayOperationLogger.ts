// DO NOT INSTRUMENT

import Analysis from '../../Type/Analysis';
import Sandbox from '../../Type/Sandbox';
import Hooks from '../../Type/Hooks';
import {appendBufferOperation} from './Util';
import LastExpressionValueContainer from '../Singleton/LastExpressionValueContainer';
import util from 'util';
import {strict as assert} from 'assert';
import {isBufferLike} from '../Util';
import TypedArray = NodeJS.TypedArray;

class TypedArrayOperationLogger extends Analysis
{
    private static readonly constructors = new Set([
        Int8Array,
        Uint8Array,
        Uint8ClampedArray,
        Int16Array,
        Uint16Array,
        Int32Array,
        Uint32Array,
        Float32Array,
        Float64Array,
    ]);
    private static readonly fromApis: Set<(iterable: ArrayLike<any>) => TypedArray> = new Set(
        Array.from(TypedArrayOperationLogger.constructors.values()).map(constructor => constructor.from),
    );
    private static readonly ofApis: Set<(...args: any[]) => TypedArray> = new Set(
        Array.from(TypedArrayOperationLogger.constructors.values()).map(constructor => constructor.of),
    );
    public forObject: Hooks['forObject'] | undefined;
    public getField: Hooks['getField'] | undefined;
    public putFieldPre: Hooks['putFieldPre'] | undefined;
    public invokeFun: Hooks['invokeFun'] | undefined;
    private appendBufferOperation = appendBufferOperation.bind(this);

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
            if (TypedArrayOperationLogger.constructors.has(f))
            {
                assert.ok(util.types.isTypedArray(result));
                this.appendBufferOperation(result, 'write', iid);
                if (isBufferLike(args[0]))
                {
                    this.appendBufferOperation(args[0], 'read', iid);
                }
            }
            // @ts-ignore
            else if (TypedArrayOperationLogger.fromApis.has(f))
            {
                assert.ok(util.types.isTypedArray(result));
                this.appendBufferOperation(result, 'write', iid);
                const iterable = args[0];
                if (isBufferLike(iterable))
                {
                    this.appendBufferOperation(iterable, 'read', iid);
                }
            }
            // @ts-ignore
            else if (TypedArrayOperationLogger.ofApis.has(f))
            {
                assert.ok(util.types.isTypedArray(result));
                this.appendBufferOperation(result, 'write', iid);
            }
        };

        this.getField = (iid, base, offset, val, isComputed, isOpAssign, isMethodCall) =>
        {
            if (util.types.isTypedArray(base))
            {
                this.appendBufferOperation(base, 'read', iid);
            }
        };

        this.putFieldPre = (iid, base, offset, val, isComputed, isOpAssign) =>
        {
            if (util.types.isTypedArray(base))
            {
                this.appendBufferOperation(base, 'write', iid);
            }
        };

        this.forObject = (iid, isForIn) =>
        {
            const lastExpressionValue = LastExpressionValueContainer.getLastExpressionValue();
            if (!isForIn && util.types.isTypedArray(lastExpressionValue))
            {
                this.appendBufferOperation(lastExpressionValue, 'read', iid);
            }
        };
    }
}

export default TypedArrayOperationLogger;