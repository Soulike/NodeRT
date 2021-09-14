// DO NOT INSTRUMENT

import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {IteratorLogStore} from '../../LogStore/IteratorLogStore';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isBufferLike} from '../../Util';

export class IteratorLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks()
    {
        this.invokeFun = (iid, _f, base) =>
        {
            if (IteratorLogStore.hasIterator(base as any))
            {
                const iteratee = IteratorLogStore.getIteratee(base as IterableIterator<any>)!;
                if (isBufferLike(iteratee))
                {
                    BufferLogStore.appendBufferOperation(iteratee, 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else
                {
                    ObjectLogStore.appendObjectOperation(iteratee, 'read', null, this.getSandbox(), iid);
                }
            }
        };
    }
}