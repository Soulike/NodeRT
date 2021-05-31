import SourceCodeInfo from '../Class/SourceCodeInfo';

interface ResourceOperation
{
    readonly type: 'read' | 'write';
    readonly sourceCodeInfo: SourceCodeInfo;
}

export default ResourceOperation;