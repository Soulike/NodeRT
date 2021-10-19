// DO NOT INSTRUMENT

import {PrimitiveOperation} from './PrimitiveOperation';
import {ResourceDeclaration} from '../../Class/ResourceDeclaration';
import {Scope} from './Scope';
import {AsyncCalledFunctionInfo} from '../../Class/AsyncCalledFunctionInfo';
import {RaceDetector} from '../../../RaceDetector';
import {PrimitiveInfo} from './PrimitiveInfo';

export class PrimitiveDeclaration extends ResourceDeclaration
{
    private readonly primitiveInfo: PrimitiveInfo;
    private readonly asyncContextToOperations: Map<AsyncCalledFunctionInfo, PrimitiveOperation[]>;

    constructor(iid: number, name: string, typeWhenDefined: 'function', scope: Scope | null, func: Function)
    constructor(iid: number, name: string, typeWhenDefined: 'var', scope: Scope | null)
    constructor(iid: number, name: string, typeWhenDefined: 'function' | 'var', scope: Scope | null, func?: Function)
    {
        super();
        this.primitiveInfo = new PrimitiveInfo(iid, name, typeWhenDefined, scope, func);
        this.asyncContextToOperations = new Map();
    }

    public getScope()
    {
        return this.primitiveInfo.getScope();
    }

    public setScope(scope: Scope)
    {
        this.primitiveInfo.setScope(scope);
    }

    public appendOperation(currentCallbackFunction: AsyncCalledFunctionInfo, variableOperation: PrimitiveOperation): void
    {
        const type = variableOperation.getType();
        const operations = this.asyncContextToOperations.get(currentCallbackFunction);
        if (type === 'write')
        {
            currentCallbackFunction.setHasWriteOperation(this);
        }
        if (operations === undefined)
        {
            this.asyncContextToOperations.set(currentCallbackFunction, [variableOperation]);
        }
        else
        {
            operations.push(variableOperation);
        }
        RaceDetector.emit('operationAppended', this);
    }

    public getAsyncContextToOperations(): ReadonlyMap<AsyncCalledFunctionInfo, PrimitiveOperation[]>
    {
        return this.asyncContextToOperations;
    }

    public getOperations(): ReadonlyMap<AsyncCalledFunctionInfo, PrimitiveOperation[]>
    {
        return this.asyncContextToOperations;
    }

    public is(name: string): boolean
    {
        return this.primitiveInfo.is(name);
    }

    public getResourceInfo(): PrimitiveInfo
    {
        return this.primitiveInfo;
    }
}