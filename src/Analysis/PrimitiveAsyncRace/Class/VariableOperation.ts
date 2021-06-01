// DO NOT INSTRUMENT

import SourceCodeInfo from '../../Class/SourceCodeInfo';
import ResourceOperation from '../../Class/ResourceOperation';

class VariableOperation extends ResourceOperation
{
    public readonly value: unknown;

    constructor(type: 'read' | 'write', value: unknown, sourceCodeInfo: SourceCodeInfo)
    {
        super(type, sourceCodeInfo);
        this.value = value;
    }
}

export default VariableOperation;