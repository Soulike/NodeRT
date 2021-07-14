// DO NOT INSTRUMENT

import fs from 'fs';
import {Sandbox} from './Type/nodeprof';
import {SourceCodeInfo} from './LogStore/Class/SourceCodeInfo';
import {Range} from './LogStore/Class/Range';
import {BufferLike} from './Analysis/Type/BufferLike';
import util from 'util';

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
        }, 4);
    }
    catch (e)
    {
        console.error(e);
        console.error(object);
        return '';
    }

}

export function isObject(value: unknown): boolean
{
    return isReference(value) && !Array.isArray(value);
}

export function isReference(value: unknown): boolean
{
    if (value === null)
    {
        return false;
    }
    return ((typeof value === 'function') || (typeof value === 'object'));
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
    } = sandbox.iidToSourceObject(iid);

    return new SourceCodeInfo(fileName, new Range(range[0], range[1]));
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