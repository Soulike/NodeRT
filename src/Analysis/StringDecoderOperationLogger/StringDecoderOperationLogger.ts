// DO NOT INSTRUMENT

import {StringDecoder} from 'string_decoder';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isBufferLike, shouldBeVerbose} from '../../Util';

export class StringDecoderOperationLogger extends Analysis
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
        this.invokeFun = (iid, f, base, args) =>
        {
            const startTimestamp = Date.now();

            if (base instanceof StringDecoder)
            {
                if (f === StringDecoder.prototype.write)
                {
                    const [buffer] = args as Parameters<typeof StringDecoder.prototype.write>;
                    BufferLogStore.appendBufferOperation(buffer, 'read', 'finish',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (f === StringDecoder.prototype.end)
                {
                    const [buffer] = args as Parameters<typeof StringDecoder.prototype.end>;
                    if (isBufferLike(buffer))
                    {
                        BufferLogStore.appendBufferOperation(buffer, 'read', 'finish',
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`StringDecoder: ${this.timeConsumed / 1000}s`);
            }
        };
    }
}