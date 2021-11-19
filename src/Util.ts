// DO NOT INSTRUMENT

import {Sandbox} from './Type/nodeprof';
import {SourceCodeInfo} from './LogStore/Class/SourceCodeInfo';
import {Range} from './LogStore/Class/Range';
import {BufferLike} from './Analysis/Type/BufferLike';
import util from 'util';
import fs from 'fs';
import {isObject, isSymbol} from 'lodash';
import {VERBOSE} from './CONFIG';
import isBigInt from 'is-bigint';

export function toJSON(object: unknown): string
{
    try
    {
        return JSON.stringify(object, function replacer(_key, value)
        {
            if (isBigInt(value))
            {
                return value.toLocaleString();
            }
            else if (value instanceof Map)
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
        return util.inspect(object, {
            depth: 5,
        });
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

export function getSourceCodeInfoFromIid(iid: number, sandbox: Sandbox): SourceCodeInfo|null
{
    const sourceObject = sandbox.iidToSourceObject(iid);
    if (!sourceObject)
    {
        return null;
    }
    else
    {
        const {name: fileName, loc} = sourceObject;
        return new SourceCodeInfo(fileName, new Range(
            loc.start.line,
            loc.start.column,
            loc.end.line,
            loc.end.column));
    }
}

export function isBufferLike(other: any): other is BufferLike
{
    return util.types.isAnyArrayBuffer(other) || util.types.isArrayBufferView(other)
        || util.types.isTypedArray(other) || Buffer.isBuffer(other);
}

/**
 * Ensures offset is a integer (in number or string type)
 */
export function isArrayAccess(isComputed: boolean, offset: string | symbol | number): offset is number | string
{
    if (!isComputed || isSymbol(offset))
    {
        return false;
    }
    else if (typeof offset === 'number')
    {
        return Number.isInteger(offset);
    }
    else    // typeof offset === 'string'
    {
        return Number.isInteger(Number.parseFloat(offset));
    }
}

export function isURL(other: unknown): other is URL
{
    return other instanceof URL;
}

export function outputSync(message: string | object, filePath: string)
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
    fs.writeFileSync(filePath, output + '\n');
}

export function shouldBeVerbose()
{
    return !!process.env[VERBOSE];
}

export function logUnboundFunction(unboundFunction: Function, boundFunction: Function)
{
    // @ts-ignore
    boundFunction.__unboundFunction = unboundFunction;
}

export function getUnboundFunction(boundFunction: Function)
{
    // @ts-ignore
    const unboundFunction = boundFunction.__unboundFunction;
    if (unboundFunction === undefined)
    {
        return boundFunction;
    }
    else
    {
        return unboundFunction;
    }
}