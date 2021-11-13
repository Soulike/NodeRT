// DO NOT INSTRUMENT

import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {IteratorLogStore} from '../../LogStore/IteratorLogStore';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isBufferLike, shouldBeVerbose} from '../../Util';

export class IteratorLogger extends Analysis
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
        this.invokeFun = (iid, _f, base) =>
        {
            const startTimestamp = Date.now();

            if (IteratorLogStore.hasIterator(base as any))
            {
                const iteratee = IteratorLogStore.getIteratee(base as IterableIterator<any>)!;
                if (isBufferLike(iteratee))
                {
                    BufferLogStore.appendBufferOperation(iteratee, 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(iteratee),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else
                {
                    ObjectLogStore.appendObjectOperation(iteratee, 'read', Object.keys(iteratee), this.getSandbox(), iid);
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`Iterator: ${this.timeConsumed / 1000}s`);
            }
        };
    }
}