// DO NOT INSTRUMENT

import childProcess from 'child_process';

console.time('node');

process.on('exit', () =>
{
    console.timeEnd('node');
});

const {error} = childProcess.spawnSync(`cd ${process.argv.slice(2,3)} && node`, process.argv.slice(3), {
    env: process.env,
    stdio: 'inherit',
    shell: true,
});

if (error)
{
    console.error(error);
}