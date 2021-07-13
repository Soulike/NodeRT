import {BufferLike} from '../Type/BufferLike';
import {BufferLogStore, BufferOperation} from '../../LogStore/BufferLogStore';
import {AsyncContextLogStore} from '../../LogStore/AsyncContextLogStore';
import {getSourceCodeInfoFromIid} from '../../Util';
import {Analysis} from '../../Type/nodeprof';

export function appendBufferOperation(this: Analysis, buffer: BufferLike, type: 'read' | 'write', iid: number)
{
    const bufferDeclaration = BufferLogStore.getBufferDeclaration(buffer);
    bufferDeclaration.appendOperation(AsyncContextLogStore.getCurrentCallbackFunction(),
        new BufferOperation(type, getSourceCodeInfoFromIid(iid, this.getSandbox())));
}