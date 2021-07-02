// DO NOT INSTRUMENT

import SourceCodeInfo from '../../Class/SourceCodeInfo';
import ResourceOperation from '../../Class/ResourceOperation';

class MapOperation extends ResourceOperation
{
    constructor(type: 'read' | 'write', sourceCodeInfo: SourceCodeInfo)
    {
        super(type, sourceCodeInfo);
    }
}

export default MapOperation;