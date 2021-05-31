import SourceCodeInfo from '../Class/SourceCodeInfo';

interface ResourceOperation
{
    readonly type: 'read' | 'write';
    readonly value: unknown;
    readonly sourceCodeInfo: SourceCodeInfo;
}

export default ResourceOperation;