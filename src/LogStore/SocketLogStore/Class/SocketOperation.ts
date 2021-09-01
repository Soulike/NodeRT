// DO NOT INSTRUMENT

import {ResourceOperation} from '../../Class/ResourceOperation';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';

export class SocketOperation extends ResourceOperation
{
    constructor(stackTrace: string[] | null, sourceCodeScopeInfo: SourceCodeInfo)
    {
        // only write for socket
        super('write', stackTrace, sourceCodeScopeInfo);
    }
}