// DO NOT INSTRUMENT

import {Dir} from 'fs';
import {Analysis, Hooks, Sandbox} from '../../../Type/nodeprof';
import {shouldBeVerbose} from '../../../Util';
import {FileLogStoreAdaptor} from '../FileLogStoreAdaptor';
import assert from 'assert';
import util from 'util';

export class FsDirOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public endExecution: Hooks['endExecution'] | undefined;

    private timeConsumed: number;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.timeConsumed = 0;
    }

    protected override registerHooks()
    {
        this.invokeFun = (iid, f, base, _args, result) =>
        {
            const startTimestamp = Date.now();

            if (base instanceof Dir)
            {
                if (f === Dir.prototype.read
                    || f === Dir.prototype.readSync)
                {
                    FileLogStoreAdaptor.appendFileOperation(base.path, 'read', 'content', this.getSandbox(), iid);
                    assert.ok(util.types.isPromise(result));
                    result.finally(() => FileLogStoreAdaptor.appendFileOperation(base.path, 'read', 'content', this.getSandbox(), iid));
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`FsDir: ${this.timeConsumed / 1000}s`);
            }
        };
    }
}