#!/usr/local/bin/node

const childProcess = require('child_process');
const path = require('path');

// TODO: parameterize nodeprof.js/ path and mx path

const argvWithAbsolutePath = process.argv.slice(2).map(value =>
{
    if (value.charAt(0) !== '-') // is a path
    {
        if (!path.isAbsolute(value))
        {
            return path.resolve(value);
        }
    }
    return value;
});

const {
    stdout,
    stderr,
    error,
} = childProcess.spawnSync(`/Users/soulike/.lib/mx/mx`, ['jalangi', ...argvWithAbsolutePath], {
    cwd: `/Users/soulike/.lib/nodeprof.js`,
    env: process.env,
});

if (stdout)
{
    console.log(stdout.toString());
}
if (stderr)
{
    console.log(stderr.toString());
}
if (error)
{
    console.error(error);
}