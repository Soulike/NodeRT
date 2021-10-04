const esbuild = require('esbuild');

esbuild.build({
    entryPoints: ['src/index.ts', 'src/bin/nodeprof.ts', 'src/bin/nodeprof-raw.ts', 'src/bin/node.ts'],
    banner: {
        js: '// DO NOT INSTRUMENT',
    },
    bundle: true,
    minifySyntax: true,
    minifyIdentifiers: true,
    minifyWhitespace: true,
    outdir: 'dist',
    platform: 'node',
    target: 'node14',
    logLevel: 'info',
})
    .catch(e =>
    {
        console.error(e);
    });