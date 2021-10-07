# NodeRAL

Node.js analysis that locates race conditions, based on NodeProf.js

## Usage

To run a analysis:

```bash
yarn nodeprof [PathToApplicationRoot] [RelativePathToTestCase]
```

For example, if the analyzed application is in `/tmp/app`, and the testcase is `/tmp/app/test/testcase.js`

```bash
yarn nodeprof /tmp/app test/testcase.js
```

If the testcase is drived by some frame, like mocha:

```bash
yarn nodeprof /tmp/app node_modules/.bin/_mocha test/testcase.js
```

For more detail, see https://github.com/Haiyang-Sun/nodeprof.js/blob/master/Tutorial.md