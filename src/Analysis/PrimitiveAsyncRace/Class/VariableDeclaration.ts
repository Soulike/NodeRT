// DO NOT INSTRUMENT

import CallbackFunction from '../../Class/CallbackFunction';
import VariableOperation from './VariableOperation';
import SourceCodeInfo from '../../Class/SourceCodeInfo';
import ResourceDeclaration from '../../Class/ResourceDeclaration';

class VariableDeclaration extends ResourceDeclaration
{
    public readonly name: string;
    public readonly asyncScope: CallbackFunction;
    /**the sourceCodeInfo of function in which the declaration is made*/
    public readonly scopeSourceCodeInfo: SourceCodeInfo | null;  // null for variables in globalThis
    private readonly operations: Map<CallbackFunction, VariableOperation[]>;

    constructor(name: string, asyncScope: CallbackFunction, scopeSourceCodeInfo: SourceCodeInfo | null)
    {
        super();
        this.name = name;
        this.asyncScope = asyncScope;
        this.scopeSourceCodeInfo = scopeSourceCodeInfo;
        this.operations = new Map();
    }

    public is() // TODO: 完善变量匹配
    {
        return false;
    }

    public appendOperation(currentCallbackFunction: CallbackFunction, variableOperation: VariableOperation)
    {
        const variableOperations = this.operations.get(currentCallbackFunction);
        if (variableOperations === undefined)
        {
            this.operations.set(currentCallbackFunction, [variableOperation]);
        }
        else
        {
            variableOperations.push(variableOperation);
        }
    }

    public getOperations()
    {
        return new Map(this.operations);
    }
}

export default VariableDeclaration;