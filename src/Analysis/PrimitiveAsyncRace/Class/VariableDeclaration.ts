// DO NOT INSTRUMENT
import CallbackFunction from '../../Class/CallbackFunction';
import VariableOperation from './VariableOperation';
import SourceCodeInfo from '../../Class/SourceCodeInfo';

class VariableDeclaration
{
    public readonly name: string;
    public readonly asyncScope: CallbackFunction;
    /**the sourceCodeInfo of function in which the declaration is made*/
    public readonly scopeSourceCodeInfo: SourceCodeInfo | null;  // null for variables in globalThis
    public readonly operations: Map<CallbackFunction, VariableOperation[]>;

    constructor(name: string, asyncScope: CallbackFunction, scopeSourceCodeInfo: SourceCodeInfo | null)
    {
        this.name = name;
        this.asyncScope = asyncScope;
        this.scopeSourceCodeInfo = scopeSourceCodeInfo;
        this.operations = new Map();
    }
}

export default VariableDeclaration;