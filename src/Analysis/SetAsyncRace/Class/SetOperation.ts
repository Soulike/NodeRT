// DO NOT INSTRUMENT

import SourceCodeInfo from '../../Class/SourceCodeInfo';
import ResourceOperation from '../../Class/ResourceOperation';

class SetOperation extends ResourceOperation
{
    constructor(type: 'read' | 'write', sourceCodeInfo: SourceCodeInfo)
    {
        super(type, sourceCodeInfo);
    }
}

export default SetOperation;