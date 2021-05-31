// DO NOT INSTRUMENT

import fs from 'fs';

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

export function isReferenceType(value: unknown): boolean
{
    return value instanceof Object;
}