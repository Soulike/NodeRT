// DO NOT INSTRUMENT

import SourceCodeInfo from '../../Class/SourceCodeInfo';

class VariableOperation
{
    public readonly type: 'read' | 'write';
    public readonly value: unknown;
    public readonly sourceCodeInfo: SourceCodeInfo;

    constructor(type: 'read' | 'write', value: unknown, sourceCodeInfo: SourceCodeInfo)
    {
        this.type = type;
        this.value = value;
        this.sourceCodeInfo = sourceCodeInfo;
    }
}

export default VariableOperation;