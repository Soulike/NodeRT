// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {LastExpressionValueLogStore} from '../../LogStore/LastExpressionValueLogStore';
import util from 'util';
import {strict as assert} from 'assert';
import {isArrayAccess, isBufferLike} from '../../Util';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {isObject} from 'lodash';
import TypedArray = NodeJS.TypedArray;

export class TypedArrayOperationLogger extends Analysis
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

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks(): void
    {
        this.invokeFun = (iid, f, base, args, result) =>
        {
            // @ts-ignore
            if (TypedArrayOperationLogger.constructors.has(f))
            {
                assert.ok(util.types.isTypedArray(result));
                ObjectLogStore.appendObjectOperation(result, 'write', this.getSandbox(), iid);
                BufferLogStore.appendBufferOperation(result, 'write', this.getSandbox(), iid);
                if (isBufferLike(args[0]))
                {
                    BufferLogStore.appendBufferOperation(args[0], 'read', this.getSandbox(), iid);
                }
                else if (isObject(args[0]))
                {
                    ObjectLogStore.appendObjectOperation(args[0], 'read', this.getSandbox(), iid);
                }
            }
            // @ts-ignore
            else if (TypedArrayOperationLogger.fromApis.has(f))
            {
                assert.ok(util.types.isTypedArray(result));
                ObjectLogStore.appendObjectOperation(result, 'write', this.getSandbox(), iid);
                BufferLogStore.appendBufferOperation(result, 'write', this.getSandbox(), iid);
                const iterable = args[0];
                if (isBufferLike(iterable))
                {
                    BufferLogStore.appendBufferOperation(iterable, 'read', this.getSandbox(), iid);
                }
                else if (isObject(iterable))
                {
                    ObjectLogStore.appendObjectOperation(iterable, 'read', this.getSandbox(), iid);
                }
            }
            // @ts-ignore
            else if (TypedArrayOperationLogger.ofApis.has(f))
            {
                assert.ok(util.types.isTypedArray(result));
                ObjectLogStore.appendObjectOperation(result, 'write', this.getSandbox(), iid);
                BufferLogStore.appendBufferOperation(result, 'write', this.getSandbox(), iid);
            }
            else if (util.types.isTypedArray(base) || Buffer.isBuffer(base))  // including Buffer since these apis are not logged in Buffer part
            {
                if (f === TypedArrayOperationLogger.typedArrayPrototype.copyWithin)
                {
                    assert.ok(util.types.isTypedArray(base));
                    BufferLogStore.appendBufferOperation(base, 'read', this.getSandbox(), iid);
                    BufferLogStore.appendBufferOperation(base, 'write', this.getSandbox(), iid);
                }
                else if (TypedArrayOperationLogger.instanceReadOnlyApis.has(f))
                {
                    assert.ok(util.types.isTypedArray(base));
                    BufferLogStore.appendBufferOperation(base, 'read', this.getSandbox(), iid);
                }
                else if (TypedArrayOperationLogger.instanceWriteOnlyApis.has(f))
                {
                    assert.ok(util.types.isTypedArray(base));
                    BufferLogStore.appendBufferOperation(base, 'write', this.getSandbox(), iid);
                }
                else if (f === TypedArrayOperationLogger.typedArrayPrototype.filter
                    || f === TypedArrayOperationLogger.typedArrayPrototype.map
                    || f === TypedArrayOperationLogger.typedArrayPrototype.slice)
                {
                    assert.ok(util.types.isTypedArray(base));
                    BufferLogStore.appendBufferOperation(base, 'read', this.getSandbox(), iid);
                    assert.ok(util.types.isTypedArray(result));
                    ObjectLogStore.appendObjectOperation(result, 'write', this.getSandbox(), iid);
                    BufferLogStore.appendBufferOperation(result, 'write', this.getSandbox(), iid);
                }
                else if (f === TypedArrayOperationLogger.typedArrayPrototype.subarray)
                {
                    assert.ok(util.types.isTypedArray(base));
                    BufferLogStore.appendBufferOperation(base, 'read', this.getSandbox(), iid);
                    assert.ok(util.types.isTypedArray(result));
                    ObjectLogStore.appendObjectOperation(result, 'write', this.getSandbox(), iid);
                }
                else if (f === TypedArrayOperationLogger.typedArrayPrototype.set)
                {
                    if (util.types.isTypedArray(args[0]))
                    {
                        BufferLogStore.appendBufferOperation(args[0], 'read', this.getSandbox(), iid);
                    }
                    else if (Array.isArray(args[0]))
                    {
                        ObjectLogStore.appendObjectOperation(args[0], 'read', this.getSandbox(), iid);
                    }
                    assert.ok(util.types.isTypedArray(base));
                    BufferLogStore.appendBufferOperation(base, 'write', this.getSandbox(), iid);
                }
            }
        };

        this.getField = (iid, base, offset, _val, isComputed) =>
        {
            if (util.types.isTypedArray(base) && !Buffer.isBuffer(base) && isArrayAccess(isComputed, offset))    // ignore Buffers, the same below
            {
                BufferLogStore.appendBufferOperation(base, 'read', this.getSandbox(), iid);
            }
        };

        this.putFieldPre = (iid, base, offset, _val, isComputed) =>
        {
            if (util.types.isTypedArray(base) && !Buffer.isBuffer(base) && isArrayAccess(isComputed, offset))
            {
                BufferLogStore.appendBufferOperation(base, 'write', this.getSandbox(), iid);
            }
        };

        this.forObject = (iid, isForIn) =>
        {
            const lastExpressionValue = LastExpressionValueLogStore.getLastExpressionValue();
            if (!isForIn && util.types.isTypedArray(lastExpressionValue) && !Buffer.isBuffer(lastExpressionValue))
            {
                BufferLogStore.appendBufferOperation(lastExpressionValue, 'read', this.getSandbox(), iid);
            }
        };
    }
}