// DO NOT INSTRUMENT

import childProcess from 'child_process';
import path from 'path';

console.time('analysis');

process.on('exit', () =>
{
    console.timeEnd('analysis');
});

const ROOT = path.resolve(__dirname, '..', '..');

const {error} = childProcess.spawnSync(`cd ${process.argv.slice(2, 3)} && graalnode`, [
    '--jvm',
    '--experimental-options',
    `--vm.Dtruffle.class.path.append=${path.resolve(ROOT, './nodeprof.js/nodeprof.jar')}`,
    '--nodeprof.Scope=app',
    '--nodeprof.ExcludeSource="test,spec"',
    '--nodeprof', path.resolve(ROOT, './nodeprof.js/nodeprof.js/src/ch.usi.inf.nodeprof/js/jalangi.js'),
    '--analysis', path.resolve(ROOT, './dist/'),
    ...process.argv.slice(3),
], {
    env: process.env,
    stdio: 'inherit',
    shell: true,
});

if (error)
{
    console.error(error);
}