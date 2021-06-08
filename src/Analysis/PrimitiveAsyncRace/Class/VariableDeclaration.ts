// DO NOT INSTRUMENT

import CallbackFunction from '../../Class/CallbackFunction';
import VariableOperation from './VariableOperation';
import SourceCodeInfo from '../../Class/SourceCodeInfo';
import ResourceDeclaration from '../../Class/ResourceDeclaration';
import Scope from '../../Class/Scope';

class VariableDeclaration extends ResourceDeclaration
{
    public readonly name: string;
    public readonly asyncScope: CallbackFunction;
    private readonly scope: Scope;
    /**the sourceCodeInfo of function in which the declaration is made*/
    public readonly scopeSourceCodeInfo: SourceCodeInfo | null;  // null for variables in globalThis
    private readonly operations: Map<CallbackFunction, VariableOperation[]>;

    constructor(name: string, asyncScope: CallbackFunction, scope: Scope, scopeSourceCodeInfo: SourceCodeInfo | null)
    {
        super();
        this.name = name;
        this.scope = scope;
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

    public getScope()
    {
        return this.scope;
    }
}

export default VariableDeclaration;