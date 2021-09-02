// DO NOT INSTRUMENT

import {Sandbox} from './Type/nodeprof';
import {SourceCodeInfo} from './LogStore/Class/SourceCodeInfo';
import {Range} from './LogStore/Class/Range';
import {BufferLike} from './Analysis/Type/BufferLike';
import util from 'util';
import fs from 'fs';
import path from 'path';
import {isObject} from 'lodash';

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
    const {name: fileName, loc, } = sandbox.iidToSourceObject(iid);
    return new SourceCodeInfo(fileName, new Range(
        loc.start.line,
        loc.start.column,
        loc.end.line,
        loc.end.column));
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

export function outputSync(message: string | object)
{
    let output: string;
    if (isObject(message))
    {
        output = toJSON(message);
    }
    else
    {
        output = message;
    }
    fs.appendFileSync(path.join('.', 'output.json'), output + '\n');
}

export function parseErrorStackTrace(stackTrace: string | undefined): string[] | null
{
    if (stackTrace === undefined)
    {
        return null;
    }
    else
    {
        const stackTraces = stackTrace.split('\n');
        return stackTraces
            .slice(1)
            .map(stackTrace => stackTrace.trim())
            .filter(stackTrace => !stackTrace.includes(__dirname));
    }
}