import {BufferLike} from '../Type/BufferLike';
import {BufferLogStore, BufferOperation} from '../../LogStore/BufferLogStore';
import {CallbackFunctionContext} from '../Singleton/CallbackFunctionContext';
import {getSourceCodeInfoFromIid} from '../../Util';
import {Analysis} from '../../Type/nodeprof';

export function appendBufferOperation(this: Analysis, buffer: BufferLike, type: 'read' | 'write', iid: number)
{
    const bufferDeclaration = BufferLogStore.getBufferDeclaration(buffer);
    bufferDeclaration.appendOperation(CallbackFunctionContext.getCurrentCallbackFunction(),
        new BufferOperation(type, getSourceCodeInfoFromIid(iid, this.getSandbox())));
}

export function isArrayAccess(isComputed: boolean, offset: string | Symbol): boolean
{
    return isComputed && !(typeof offset === 'symbol') && !Number.isNaN(Number.parseInt(offset as string));
}