# NodeRT

Node.js analysis tool that detects race conditions, based on NodeProf.js.

## Prerequisite

- Node.js LTS
- yarn
- GraalVM 21.2.0
## Setup

### Node.js Dependency Installation

```bash
$ cd NodeRT
$ yarn
```

### Graaljs Installation

See https://www.graalvm.org/docs/getting-started/#run-javascript-and-nodejs.

### GraalVM Configuration

Link `<graalvm>/bin/node` as `graalnode` and put the symbol link into your `PATH`. After that, you should be able to run the node executable of Graaljs like this:

```bash
$ graalnode
v14.16.1
```

## Usage

To run a analysis:

```bash
$ yarn nodeprof [PathToApplicationRoot] [RelativePathToTestCase]
```

For example, if the analyzed application is in `/tmp/app`, and the testcase is `/tmp/app/test/testcase.js`

```bash
$ yarn nodeprof /tmp/app test/testcase.js
```

If the testcase is drived by some frames, like mocha:

```bash
$ yarn nodeprof:test /tmp/app node_modules/.bin/_mocha test/testcase.js
```

The bug report will be saved as a json file named `violations.json` under the path of the analyzed application.