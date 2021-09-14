const esbuild = require('esbuild');

esbuild.build({
    entryPoints: ['src/index.ts', 'src/bin/nodeprof.ts', 'src/bin/node.ts'],
    banner: {
        js: '// DO NOT INSTRUMENT',
    },
    bundle: true,
    minifySyntax: true,
    outdir: 'dist',
    platform: 'node',
    logLevel: 'info',
})
    .catch(e =>
    {
        console.error(e);
    });