// DO NOT INSTRUMENT

import childProcess from 'child_process';

console.time('node');

process.on('exit', () =>
{
    console.timeEnd('node');
});

const {error} = childProcess.spawnSync(`node`, process.argv.slice(2), {
    env: process.env,
    stdio: 'inherit',
});

if (error)
{
    console.error(error);
}