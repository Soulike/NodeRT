// DO NOT INSTRUMENT

import childProcess from 'child_process';
import path from 'path';

console.time('analysis');

process.on('exit', () =>
{
    console.timeEnd('analysis');
});

const ROOT = path.resolve(__dirname, '..', '..');

const {error} = childProcess.spawnSync(`graalnode`, [
    '--jvm',
    '--experimental-options',
    `--vm.Dtruffle.class.path.append=${path.resolve(ROOT, './lib/nodeprof.jar')}`,
    '--nodeprof.Scope=app',
    '--nodeprof.ExcludeSource=test',
    '--nodeprof', path.resolve(ROOT, './lib/nodeprof.js/src/ch.usi.inf.nodeprof/js/jalangi.js'),
    ...process.argv.slice(2),
], {
    env: process.env,
    stdio: 'inherit',
    shell: true,
});

if (error)
{
    console.error(error);
}