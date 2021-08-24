// DO NOT INSTRUMENT

import {Dir} from 'fs';
import {Analysis, Hooks, Sandbox} from '../../../Type/nodeprof';
import {FileLogStoreAdaptor} from '../FileLogStoreAdaptor';

export class FsDirOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    
    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks()
    {
        this.invokeFun = (iid, f, base) =>
        {
            if (f === Dir.prototype.read
            || f === Dir.prototype.readSync)
            {
                if(base instanceof Dir)
                {
                    FileLogStoreAdaptor.appendFileOperation(base.path, 'read', this.getSandbox(), iid);
                }
            }
        }
    }
}