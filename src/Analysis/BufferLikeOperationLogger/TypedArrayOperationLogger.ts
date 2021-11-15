// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import {isObject} from 'lodash';
import util from 'util';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {IteratorLogStore} from '../../LogStore/IteratorLogStore';
import {LastExpressionValueLogStore} from '../../LogStore/LastExpressionValueLogStore';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isArrayAccess, shouldBeVerbose} from '../../Util';

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
    public invokeFunPre: Hooks['invokeFunPre'] | undefined;
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
        this.invokeFunPre = (iid, f, base, args) =>
        {
            const startTimestamp = Date.now();

            if (util.types.isTypedArray(base))
            {
                if (f === TypedArrayOperationLogger.typedArrayPrototype.copyWithin)
                {
                    let [target, start, end] = args as Parameters<typeof TypedArrayOperationLogger.typedArrayPrototype.copyWithin>;
                    if (target < 0)
                    {
                        target += base.length;
                    }
                    else if (target >= base.length)
                    {
                        return;
                    }

                    if (start === undefined)
                    {
                        start = 0;
                    }
                    else if (start < 0)
                    {
                        start += base.length;
                    }
                    else if (start >= base.length)
                    {
                        return;
                    }

                    if (end === undefined)
                    {
                        end = base.length;
                    }
                    else if (end < 0)
                    {
                        end += base.length;
                    }
                    else if (end > base.length)
                    {
                        end = base.length;
                    }
                    BufferLogStore.appendBufferOperation(base.buffer, 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(base, start * base.BYTES_PER_ELEMENT, end * base.BYTES_PER_ELEMENT),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));

                    const writtenLength = end - start;
                    BufferLogStore.appendBufferOperation(base.buffer, 'write', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(base, target * base.BYTES_PER_ELEMENT, (target + writtenLength) * base.BYTES_PER_ELEMENT),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (f === TypedArrayOperationLogger.typedArrayPrototype.fill)
                {
                    let [, start, end] = args as Parameters<typeof TypedArrayOperationLogger.typedArrayPrototype.fill>;
                    if (start === undefined)
                    {
                        start = 0;
                    }
                    else if (start < 0)
                    {
                        start += base.length;
                    }
                    else if (start >= base.length)
                    {
                        return;
                    }

                    if (end === undefined)
                    {
                        end = base.length;
                    }
                    else if (end < 0)
                    {
                        end += base.length;
                    }
                    else if (end > base.length)
                    {
                        end = base.length;
                    }
                    BufferLogStore.appendBufferOperation(base.buffer, 'write', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(base, start * base.BYTES_PER_ELEMENT, end * base.BYTES_PER_ELEMENT),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (f === TypedArrayOperationLogger.typedArrayPrototype.reverse
                    || f === TypedArrayOperationLogger.typedArrayPrototype.sort)
                {
                    BufferLogStore.appendBufferOperation(base.buffer, 'write', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(base),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (f === TypedArrayOperationLogger.typedArrayPrototype.every
                    || f === TypedArrayOperationLogger.typedArrayPrototype.find
                    || f === TypedArrayOperationLogger.typedArrayPrototype.findIndex
                    || f === TypedArrayOperationLogger.typedArrayPrototype.forEach
                    || f === TypedArrayOperationLogger.typedArrayPrototype.reduce
                    || f === TypedArrayOperationLogger.typedArrayPrototype.reduceRight
                    || f === TypedArrayOperationLogger.typedArrayPrototype.some
                    || f === TypedArrayOperationLogger.typedArrayPrototype.toLocaleString
                    || f === TypedArrayOperationLogger.typedArrayPrototype.toString)
                {
                    BufferLogStore.appendBufferOperation(base.buffer, 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(base),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (f === TypedArrayOperationLogger.typedArrayPrototype.includes
                    || f === TypedArrayOperationLogger.typedArrayPrototype.indexOf
                    || f === TypedArrayOperationLogger.typedArrayPrototype.lastIndexOf)
                {
                    let [value, byteOffset] = args as Parameters<typeof TypedArrayOperationLogger.typedArrayPrototype.includes
                        | typeof TypedArrayOperationLogger.typedArrayPrototype.indexOf
                        | typeof TypedArrayOperationLogger.typedArrayPrototype.lastIndexOf>;
                    if (byteOffset === undefined)
                    {
                        byteOffset = 0;
                    }
                    if (util.types.isTypedArray(value))
                    {
                        BufferLogStore.appendBufferOperation(value.buffer, 'read', 'finish',
                            BufferLogStore.getArrayBufferRangeOfArrayBufferView(value),
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                    BufferLogStore.appendBufferOperation(base.buffer, 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(base, byteOffset),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (f === TypedArrayOperationLogger.typedArrayPrototype.slice)
                {
                    let [start, end] = args as Parameters<typeof TypedArrayOperationLogger.typedArrayPrototype.slice>;
                    if (start === undefined)
                    {
                        start = 0;
                    }
                    else if (start < 0)
                    {
                        start += base.length;
                    }
                    else if (start >= base.length)
                    {
                        return;
                    }

                    if (end === undefined)
                    {
                        end = base.length;
                    }
                    else if (end < 0)
                    {
                        end += base.length;
                    }
                    else if (end > base.length)
                    {
                        end = base.length;
                    }
                    BufferLogStore.appendBufferOperation(base.buffer, 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(base, start * base.BYTES_PER_ELEMENT, end * base.BYTES_PER_ELEMENT),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    // result is processed in invokeFun
                }
                else if (f === TypedArrayOperationLogger.typedArrayPrototype.join)
                {
                    BufferLogStore.appendBufferOperation(base.buffer, 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(base),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (f === TypedArrayOperationLogger.typedArrayPrototype.set)
                {
                    let [source, offset] = args as Parameters<typeof TypedArrayOperationLogger.typedArrayPrototype.set>;
                    if (offset === undefined)
                    {
                        offset = 0;
                    }
                    if (util.types.isTypedArray(source))
                    {
                        BufferLogStore.appendBufferOperation(source.buffer, 'read', 'finish',
                            BufferLogStore.getArrayBufferRangeOfArrayBufferView(source),
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                    else if (isObject(source))
                    {
                        ObjectLogStore.appendObjectOperation(source, 'read', Object.keys(source), false, this.getSandbox(), iid);
                    }

                    BufferLogStore.appendBufferOperation(base.buffer, 'write', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(base, offset * base.BYTES_PER_ELEMENT),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (f === TypedArrayOperationLogger.typedArrayPrototype.subarray)
                {
                    // pass
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.invokeFun = (iid, f, base, args, result) =>
        {
            const startTimestamp = Date.now();

            // @ts-ignore
            if (TypedArrayOperationLogger.constructors.has(f))
            {
                assert.ok(util.types.isTypedArray(result));
                if (util.types.isTypedArray(args[0]))
                {
                    BufferLogStore.appendBufferOperation(args[0].buffer, 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[0]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    BufferLogStore.appendBufferOperation(result.buffer, 'write', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(result),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (util.types.isAnyArrayBuffer(args[0]))
                {
                    // pass
                }
                else if (isObject(args[0]))
                {
                    ObjectLogStore.appendObjectOperation(args[0], 'read', Object.keys(args[0]), false, this.getSandbox(), iid);
                    BufferLogStore.appendBufferOperation(result.buffer, 'write', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(result),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }
            else if (TypedArrayOperationLogger.ofApis.has(f))
            {
                assert.ok(util.types.isTypedArray(result));
                BufferLogStore.appendBufferOperation(result.buffer, 'write', 'finish',
                    BufferLogStore.getArrayBufferRangeOfArrayBufferView(result),
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }
            else if (TypedArrayOperationLogger.fromApis.has(f))
            {
                const source = args[0];
                assert.ok(isObject(source));
                if (util.types.isTypedArray(source))
                {
                    BufferLogStore.appendBufferOperation(source.buffer, 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(source),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (util.types.isAnyArrayBuffer(source))
                {
                    BufferLogStore.appendBufferOperation(source, 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(Buffer.from(source)),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else
                {
                    ObjectLogStore.appendObjectOperation(source, 'read', Object.keys(source), false, this.getSandbox(), iid);
                }

                assert.ok(util.types.isTypedArray(result));
                BufferLogStore.appendBufferOperation(result.buffer, 'write', 'finish',
                    BufferLogStore.getArrayBufferRangeOfArrayBufferView(result),
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }
            else if (util.types.isTypedArray(base))
            {
                if (f === TypedArrayOperationLogger.typedArrayPrototype.filter
                    || f === TypedArrayOperationLogger.typedArrayPrototype.map)
                {
                    BufferLogStore.appendBufferOperation(base.buffer, 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(base),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));

                    assert.ok(util.types.isTypedArray(result));
                    BufferLogStore.appendBufferOperation(result.buffer, 'write', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(result),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (f === TypedArrayOperationLogger.typedArrayPrototype.slice)
                {
                    assert.ok(util.types.isTypedArray(result));
                    BufferLogStore.appendBufferOperation(result.buffer, 'write', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(result),
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
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.getField = (iid, base, offset, _val, isComputed) =>
        {
            const startTimestamp = Date.now();

            if (util.types.isTypedArray(base) && !Buffer.isBuffer(base) && isArrayAccess(isComputed, offset))    // ignore Buffers, the same below
            {
                offset = typeof offset === 'number' ? offset : Number.parseInt(offset);
                assert.ok(!Number.isNaN(offset));
                BufferLogStore.appendBufferOperation(base.buffer, 'read', 'finish',
                    BufferLogStore.getArrayBufferRangeOfArrayBufferView(base,
                        offset * base.BYTES_PER_ELEMENT,
                        (offset + 1) * base.BYTES_PER_ELEMENT), this.getSandbox(), iid);
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.putFieldPre = (iid, base, offset, val, isComputed) =>
        {
            const startTimestamp = Date.now();

            if (util.types.isTypedArray(base) && !Buffer.isBuffer(base) && isArrayAccess(isComputed, offset)
                && base[offset as number] !== val)
            {
                offset = typeof offset === 'number' ? offset : Number.parseInt(offset);
                assert.ok(!Number.isNaN(offset));
                BufferLogStore.appendBufferOperation(base.buffer, 'write', 'finish',
                    BufferLogStore.getArrayBufferRangeOfArrayBufferView(base,
                        offset * base.BYTES_PER_ELEMENT,
                        (offset + 1) * base.BYTES_PER_ELEMENT), this.getSandbox(), iid);
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.forObject = (iid, isForIn) =>
        {
            const startTimestamp = Date.now();

            const lastExpressionValue = LastExpressionValueLogStore.getLastExpressionValue();
            if (!isForIn && util.types.isTypedArray(lastExpressionValue) && !Buffer.isBuffer(lastExpressionValue))
            {
                BufferLogStore.appendBufferOperation(lastExpressionValue.buffer, 'read', 'finish',
                    BufferLogStore.getArrayBufferRangeOfArrayBufferView(lastExpressionValue),
                    this.getSandbox(), iid);
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