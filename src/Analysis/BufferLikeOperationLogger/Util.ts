import BufferLike from '../Type/BufferLike';
import BufferLogger, {BufferOperation} from '../Singleton/BufferLogger';
import CallbackFunctionContext from '../Singleton/CallbackFunctionContext';
import {getSourceCodeInfoFromIid} from '../Util';
import Analysis from '../../Type/Analysis';

export function appendBufferOperation(this: Analysis, buffer: BufferLike, type: 'read' | 'write', iid: number)
{
    const bufferDeclaration = BufferLogger.getBufferDeclaration(buffer);
    bufferDeclaration.appendOperation(CallbackFunctionContext.getCurrentCallbackFunction(),
        new BufferOperation('write', getSourceCodeInfoFromIid(iid, this.getSandbox())));
}