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

    private static typedArrayPrototype = Uint8Array.prototype;  // All TypedArrays share the same prototype

    private static instanceReadOnlyApis: Set<Function> = new Set([
        TypedArrayOperationLogger.typedArrayPrototype.every,
        TypedArrayOperationLogger.typedArrayPrototype.find,
        TypedArrayOperationLogger.typedArrayPrototype.findIndex,
        TypedArrayOperationLogger.typedArrayPrototype.forEach,
        TypedArrayOperationLogger.typedArrayPrototype.includes,
        TypedArrayOperationLogger.typedArrayPrototype.indexOf,
        TypedArrayOperationLogger.typedArrayPrototype.join,
        TypedArrayOperationLogger.typedArrayPrototype.lastIndexOf,
        TypedArrayOperationLogger.typedArrayPrototype.reduce,
        TypedArrayOperationLogger.typedArrayPrototype.reduceRight,
        TypedArrayOperationLogger.typedArrayPrototype.some,
        TypedArrayOperationLogger.typedArrayPrototype.toLocaleString,
        TypedArrayOperationLogger.typedArrayPrototype.toString,
    ]);

    private static instanceWriteOnlyApis: Set<Function> = new Set([
        TypedArrayOperationLogger.typedArrayPrototype.fill,
        TypedArrayOperationLogger.typedArrayPrototype.reverse,
        TypedArrayOperationLogger.typedArrayPrototype.sort,
    ]);

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
            else if (f === TypedArrayOperationLogger.typedArrayPrototype.copyWithin)
            {
                assert.ok(util.types.isTypedArray(base));
                this.appendBufferOperation(base, 'read', iid);
                this.appendBufferOperation(base, 'write', iid);
            }
            // TODO: 迭代器支持
            else if (TypedArrayOperationLogger.instanceReadOnlyApis.has(f))
            {
                assert.ok(util.types.isTypedArray(base));
                this.appendBufferOperation(base, 'read', iid);
            }
            else if (TypedArrayOperationLogger.instanceWriteOnlyApis.has(f))
            {
                assert.ok(util.types.isTypedArray(base));
                this.appendBufferOperation(base, 'write', iid);
            }
            else if (f === TypedArrayOperationLogger.typedArrayPrototype.filter
                || f === TypedArrayOperationLogger.typedArrayPrototype.map
                || f === TypedArrayOperationLogger.typedArrayPrototype.slice
                || f === TypedArrayOperationLogger.typedArrayPrototype.subarray)
            {
                assert.ok(util.types.isTypedArray(base));
                this.appendBufferOperation(base, 'read', iid);
                assert.ok(util.types.isTypedArray(result));
                this.appendBufferOperation(result, 'write', iid);
            }
            else if (f === TypedArrayOperationLogger.typedArrayPrototype.set)    // TODO: 数组读取记录
            {
                if (util.types.isTypedArray(args[0]))
                {
                    this.appendBufferOperation(args[0], 'read', iid);
                }
                assert.ok(util.types.isTypedArray(base));
                this.appendBufferOperation(base, 'write', iid);
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