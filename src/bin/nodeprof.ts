// DO NOT INSTRUMENT

import childProcess from 'child_process';
import path from 'path';

const ROOT = path.resolve(__dirname, '..', '..');

const {error} = childProcess.spawnSync(`graalnode`, [
    '--jvm',
    '--experimental-options',
    `--vm.Dtruffle.class.path.append=${path.resolve(ROOT, './lib/nodeprof.jar')}`,
    '--nodeprof.Scope=module',
    '--nodeprof', path.resolve(ROOT, './lib/nodeprof.js/src/ch.usi.inf.nodeprof/js/jalangi.js'),
    ...process.argv.slice(2),
], {
    env: process.env,
    stdio: 'inherit',
});

if (error)
{
    console.error(error);
}