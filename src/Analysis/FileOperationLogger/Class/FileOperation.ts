// DO NOT INSTRUMENT

import ResourceOperation from '../../Class/ResourceOperation';
import SourceCodeInfo from '../../Class/SourceCodeInfo';

class FileOperation extends ResourceOperation
{
    constructor(type: 'read' | 'write', sourceCodeInfo: SourceCodeInfo)
    {
        super(type, sourceCodeInfo);
    }
}

export default FileOperation;