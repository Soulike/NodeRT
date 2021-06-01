// DO NOT INSTRUMENT

import fs from 'fs';
import Sandbox from '../Type/Sandbox';
import SourceCodeInfo from './Class/SourceCodeInfo';
import Range from './Class/Range';

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
    if (value === null)
    {
        return false;
    }
    return ((typeof value === 'function') || (typeof value === 'object')) && !Array.isArray(value);
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