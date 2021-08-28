// DO NOT INSTRUMENT

import {StringDecoder} from 'string_decoder';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isBufferLike} from '../../Util';

export class StringDecoderOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks()
    {
        this.invokeFun = (iid, f, base, args) =>
        {
            if (base instanceof StringDecoder)
            {
                if (f === StringDecoder.prototype.write)
                {
                    const [buffer] = args as Parameters<typeof StringDecoder.prototype.write>;
                    BufferLogStore.appendBufferOperation(buffer, 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (f === StringDecoder.prototype.end)
                {
                    const [buffer] = args as Parameters<typeof StringDecoder.prototype.end>;
                    if (isBufferLike(buffer))
                    {
                        BufferLogStore.appendBufferOperation(buffer, 'read',
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                }
            }
        };
    }
}