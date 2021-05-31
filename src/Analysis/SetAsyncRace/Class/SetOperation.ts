// DO NOT INSTRUMENT

import ResourceOperation from '../../Interface/ResourceOperation';
import SourceCodeInfo from '../../Class/SourceCodeInfo';

class SetOperation implements ResourceOperation
{
    public readonly type: 'read' | 'write';
    public readonly sourceCodeInfo: SourceCodeInfo;

    constructor(type: 'read' | 'write', sourceCodeInfo: SourceCodeInfo)
    {
        this.type = type;
        this.sourceCodeInfo = sourceCodeInfo;
    }
}

export default SetOperation;