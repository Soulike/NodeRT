// DO NOT INSTRUMENT

import './Analysis';
import {shouldBeVerbose} from './Util';

console.time('entry');

process.on('exit', () =>
{
    if (shouldBeVerbose())
    {
        console.timeEnd('entry');
    }
});