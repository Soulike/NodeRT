// DO NOT INSTRUMENT

import './Analysis';

console.time('entry');

process.on('exit', () =>
{
    console.timeEnd('entry');
});