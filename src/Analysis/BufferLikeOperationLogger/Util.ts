import BufferLike from '../Type/BufferLike';
import BufferLogger, {BufferOperation} from '../Singleton/BufferLogger';
import CallbackFunctionContext from '../Singleton/CallbackFunctionContext';
import {getSourceCodeInfoFromIid} from '../Util';
import {Analysis} from '../../Type/nodeprof';

export function appendBufferOperation(this: Analysis, buffer: BufferLike, type: 'read' | 'write', iid: number)
{
    const bufferDeclaration = BufferLogger.getBufferDeclaration(buffer);
    bufferDeclaration.appendOperation(CallbackFunctionContext.getCurrentCallbackFunction(),
        new BufferOperation(type, getSourceCodeInfoFromIid(iid, this.getSandbox())));
}