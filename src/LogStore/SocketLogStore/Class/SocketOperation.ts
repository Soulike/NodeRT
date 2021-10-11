// DO NOT INSTRUMENT

import {ResourceOperation} from '../../Class/ResourceOperation';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {StatisticsStore} from '../../StatisticsStore';

export class SocketOperation extends ResourceOperation
{
    constructor(type: 'read'|'write', stackTrace: string[] | null, sourceCodeScopeInfo: SourceCodeInfo)
    {
        // only write for socket
        super(type, stackTrace, sourceCodeScopeInfo);
        StatisticsStore.addSocketOperationCount();
    }
}