// DO NOT INSTRUMENT

import fs from 'fs';
import {Sandbox} from './Type/nodeprof';
import {SourceCodeInfo} from './LogStore/Class/SourceCodeInfo';
import {Range} from './LogStore/Class/Range';
import {BufferLike} from './Analysis/Type/BufferLike';
import util from 'util';
import {isFunction, isObject} from 'lodash';
import {ObjectLogStore} from './LogStore/ObjectLogStore';
import {BufferLogStore} from './LogStore/BufferLogStore';
import assert from 'assert';

export function printSync(content: string): void
{
    fs.writeFileSync(1, `${content}\n`, {encoding: 'utf-8'});
}

export function toJSON(object: unknown): string
{
    try
    {
        return JSON.stringify(object, function replacer(_key, value)
        {
            if (value instanceof Map)
            {
                return {
                    dataType: 'Map',
                    value: Array.from(value.entries()), // or with spread: value: [...value]
                };
            }
            else if (value instanceof Set)
            {
                return {
                    dataType: 'Set',
                    value: Array.from(value.entries()), // or with spread: value: [...value]
                };
            }
            else if (typeof value === 'function')
            {
                return `[Function ${value.name ? value.name : 'anonymous'}]`;
            }
            else if (value instanceof Promise)
            {
                return `[Promise]`;
            }
            else
            {
                return value;
            }
        }, 2);
    }
    catch (e)
    {
        console.error(e);
        console.error(object);
        return '';
    }

}

export function isPrimitive(value: unknown): boolean
{
    if (value === null || value === undefined)
    {
        return false;
    }
    return !(Object(value) === value);
}

export function getSourceCodeInfoFromIid(iid: number, sandbox: Sandbox)
{
    const {
        name: fileName,
        range,
        loc,
    } = sandbox.iidToSourceObject(iid);

    return new SourceCodeInfo(fileName, new Range(range[0], range[1],
        loc.start.line, loc.start.column, loc.end.line, loc.end.column));
}

export function isBufferLike(other: any): other is BufferLike
{
    return util.types.isAnyArrayBuffer(other) || util.types.isArrayBufferView(other)
        || util.types.isTypedArray(other) || Buffer.isBuffer(other);
}

export function isArrayAccess(isComputed: boolean, offset: string | Symbol): boolean
{
    return isComputed && !(typeof offset === 'symbol') && !Number.isNaN(Number.parseInt(offset as string));
}

export function isURL(other: unknown): other is URL
{
    return other instanceof URL;
}

export function getFunctionProperties(object: any): Set<Function> | never
{
    const functions: Set<Function> = new Set();
    Object.getOwnPropertyNames(object).forEach(key =>
    {
        try
        {
            if (isFunction(object[key]))
            {
                functions.add(object[key]);
            }
        }
        catch (e)
        {
            // ignore
        }
    });
    return functions;
}

export function logObjectArgsAsReadOperation(args: unknown[], sandbox: Sandbox, iid: number): void
{
    for (const arg of args)
    {
        if (isBufferLike(arg))
        {
            BufferLogStore.appendBufferOperation(arg, 'read',
                getSourceCodeInfoFromIid(iid, sandbox));
        }
        else if (isObject(arg))
        {
            ObjectLogStore.appendObjectOperation(arg, 'read', sandbox, iid);
        }
    }
}

export function logObjectResultAsWriteOperation(result: unknown, sandbox: Sandbox, iid: number): void
{
    if (isObject(result))
    {
        ObjectLogStore.appendObjectOperation(result, 'write', sandbox, iid);
        if (isBufferLike(result))
        {
            BufferLogStore.appendBufferOperation(result, 'write',
                getSourceCodeInfoFromIid(iid, sandbox));
        }
    }
}

function logObjectBaseAsOperation(base: object, sandbox: Sandbox, iid: number, type: 'read'|'write'): void
{
    assert.ok(isObject(base));
    if (isBufferLike(base))
    {
        BufferLogStore.appendBufferOperation(base, type,
            getSourceCodeInfoFromIid(iid, sandbox));
    }
    else if (isObject(base))
    {
        ObjectLogStore.appendObjectOperation(base, type, sandbox, iid);
    }
}

export function logObjectBaseAsReadOperation(base: object, sandbox: Sandbox, iid: number): void
{
    logObjectBaseAsOperation(base, sandbox, iid, 'read');
}

export function logObjectBaseAsWriteOperation(base: object, sandbox: Sandbox, iid: number): void
{
    logObjectBaseAsOperation(base, sandbox, iid, 'write');
}