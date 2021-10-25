// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import {isObject} from 'lodash';
import util from 'util';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {IteratorLogStore} from '../../LogStore/IteratorLogStore';
import {LastExpressionValueLogStore} from '../../LogStore/LastExpressionValueLogStore';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isArrayAccess, isBufferLike, shouldBeVerbose} from '../../Util';

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
    private static readonly fromApis: Set<Function> = new Set(
        Array.from(TypedArrayOperationLogger.constructors.values()).map(constructor => constructor.from),
    );
    private static readonly ofApis: Set<Function> = new Set(
        Array.from(TypedArrayOperationLogger.constructors.values()).map(constructor => constructor.of),
    );

    private static typedArrayPrototype = Uint8Array.prototype;  // All TypedArrays share the same prototype

    public forObject: Hooks['forObject'] | undefined;
    public getField: Hooks['getField'] | undefined;
    public putFieldPre: Hooks['putFieldPre'] | undefined;
    public invokeFun: Hooks['invokeFun'] | undefined;
    public endExecution: Hooks['endExecution'] | undefined;

    private timeConsumed: number;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.timeConsumed = 0;
    }

    protected override registerHooks(): void
    {
        this.invokeFun = (iid, f, base, args, result) =>
        {
            const startTimestamp = Date.now();

            // @ts-ignore
            if (TypedArrayOperationLogger.constructors.has(f)
                || TypedArrayOperationLogger.ofApis.has(f))
            {
                if (util.types.isTypedArray(args[0]))
                {
                    BufferLogStore.appendBufferOperation(args[0], 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (util.types.isAnyArrayBuffer(args[0]))
                {
                    // pass
                }
                else if (isObject(args[0]))
                {
                    ObjectLogStore.appendObjectOperation(args[0], 'read', null, this.getSandbox(), iid);
                }

                assert.ok(util.types.isTypedArray(result));
                BufferLogStore.appendBufferOperation(result, 'write',
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }
            else if (TypedArrayOperationLogger.fromApis.has(f))
            {
                const source = args[0];
                assert.ok(isObject(source));
                if (isBufferLike(source))
                {
                    BufferLogStore.appendBufferOperation(source, 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else
                {
                    ObjectLogStore.appendObjectOperation(source, 'read', null, this.getSandbox(), iid);
                }

                assert.ok(util.types.isTypedArray(result));
                BufferLogStore.appendBufferOperation(result, 'write',
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }
            else if (util.types.isTypedArray(base))
            {
                if (f === TypedArrayOperationLogger.typedArrayPrototype.copyWithin
                    || f === TypedArrayOperationLogger.typedArrayPrototype.fill
                    || f === TypedArrayOperationLogger.typedArrayPrototype.reverse
                    || f === TypedArrayOperationLogger.typedArrayPrototype.sort)
                {
                    BufferLogStore.appendBufferOperation(base, 'write',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (f === TypedArrayOperationLogger.typedArrayPrototype.every
                    || f === TypedArrayOperationLogger.typedArrayPrototype.find
                    || f === TypedArrayOperationLogger.typedArrayPrototype.findIndex
                    || f === TypedArrayOperationLogger.typedArrayPrototype.forEach
                    || f === TypedArrayOperationLogger.typedArrayPrototype.includes
                    || f === TypedArrayOperationLogger.typedArrayPrototype.indexOf
                    || f === TypedArrayOperationLogger.typedArrayPrototype.lastIndexOf
                    || f === TypedArrayOperationLogger.typedArrayPrototype.reduce
                    || f === TypedArrayOperationLogger.typedArrayPrototype.reduceRight
                    || f === TypedArrayOperationLogger.typedArrayPrototype.some
                    || f === TypedArrayOperationLogger.typedArrayPrototype.toLocaleString
                    || f === TypedArrayOperationLogger.typedArrayPrototype.toString)
                {
                    BufferLogStore.appendBufferOperation(base, 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (f === TypedArrayOperationLogger.typedArrayPrototype.filter
                    || f === TypedArrayOperationLogger.typedArrayPrototype.map
                    || f === TypedArrayOperationLogger.typedArrayPrototype.slice)
                {
                    BufferLogStore.appendBufferOperation(base, 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));

                    assert.ok(isBufferLike(result));
                    BufferLogStore.appendBufferOperation(result, 'write',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (f === TypedArrayOperationLogger.typedArrayPrototype.join)
                {
                    BufferLogStore.appendBufferOperation(base, 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (f === TypedArrayOperationLogger.typedArrayPrototype.set)
                {
                    const source = args[0];
                    if (isBufferLike(source))
                    {
                        BufferLogStore.appendBufferOperation(source, 'read',
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                    else if (isObject(source))
                    {
                        ObjectLogStore.appendObjectOperation(source, 'read', null, this.getSandbox(), iid);
                    }

                    BufferLogStore.appendBufferOperation(base, 'write',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (f === TypedArrayOperationLogger.typedArrayPrototype[Symbol.iterator]
                    || f === TypedArrayOperationLogger.typedArrayPrototype.entries
                    || f === TypedArrayOperationLogger.typedArrayPrototype.values)
                {
                    IteratorLogStore.addIterator(
                        result as IterableIterator<any>,
                        base);
                }
                else if (f === TypedArrayOperationLogger.typedArrayPrototype.subarray)
                {
                    // pass
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.getField = (iid, base, offset, _val, isComputed) =>
        {
            const startTimestamp = Date.now();

            if (util.types.isTypedArray(base) && !Buffer.isBuffer(base) && isArrayAccess(isComputed, offset))    // ignore Buffers, the same below
            {
                BufferLogStore.appendBufferOperation(base, 'read', this.getSandbox(), iid);
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.putFieldPre = (iid, base, offset, _val, isComputed) =>
        {
            const startTimestamp = Date.now();

            if (util.types.isTypedArray(base) && !Buffer.isBuffer(base) && isArrayAccess(isComputed, offset))
            {
                BufferLogStore.appendBufferOperation(base, 'write', this.getSandbox(), iid);
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.forObject = (iid, isForIn) =>
        {
            const startTimestamp = Date.now();

            const lastExpressionValue = LastExpressionValueLogStore.getLastExpressionValue();
            if (!isForIn && util.types.isTypedArray(lastExpressionValue) && !Buffer.isBuffer(lastExpressionValue))
            {
                BufferLogStore.appendBufferOperation(lastExpressionValue, 'read', this.getSandbox(), iid);
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`TypedArray: ${this.timeConsumed / 1000}s`);
            }
        };
    }
}