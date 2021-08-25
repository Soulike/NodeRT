// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import {IncomingMessage, OutgoingMessage} from 'http';
import {BufferLogStore} from '../../../LogStore/BufferLogStore';
import {SocketLogStore} from '../../../LogStore/SocketLogStore';
import {Analysis, Hooks, Sandbox} from '../../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isBufferLike} from '../../../Util';

export class HttpIncomingMessageOperationLogger extends Analysis
{
    public invokeFunPre: Hooks['invokeFunPre'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks()
    {
        this.invokeFunPre = (iid, f, base) =>
        {
            if (f === IncomingMessage.prototype.destroy)
            {
                assert.ok(base instanceof IncomingMessage);
                const socket = base.socket;
                if (socket !== null)
                {
                    SocketLogStore.appendSocketOperation(socket, this.getSandbox(), iid);
                }
            }
        };
    }
}