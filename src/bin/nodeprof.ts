// DO NOT INSTRUMENT

import childProcess from 'child_process';
import path from 'path';
import {NODEPROF_PATH, ROOT} from './config';

console.time('analysis');

process.on('exit', () =>
{
    console.timeEnd('analysis');
});

const {error} = childProcess.spawnSync(`cd ${process.argv.slice(2, 3)} && graalnode`, [
    '--jvm',
    '--experimental-options',
    `--vm.Dtruffle.class.path.append=${NODEPROF_PATH}`,
    '--nodeprof.Scope=app',
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