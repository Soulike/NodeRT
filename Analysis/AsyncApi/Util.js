// DO NOT INSTRUMENT
const fs = require('fs');

function printSync(content)
{
    fs.writeFileSync(1, `${content}\n`, {encoding: 'utf-8'});
}

function toJSON(object)
{
    try
    {
        return JSON.stringify(object, function replacer(key, value)
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
    }

}

module.exports = {
    printSync,
    toJSON,
};