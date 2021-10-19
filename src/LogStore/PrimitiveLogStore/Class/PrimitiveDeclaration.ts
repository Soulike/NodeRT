// DO NOT INSTRUMENT

import {PrimitiveOperation} from './PrimitiveOperation';
import {ResourceDeclaration} from '../../Class/ResourceDeclaration';
import {Scope} from './Scope';
import {AsyncCalledFunctionInfo} from '../../Class/AsyncCalledFunctionInfo';
import {isFunction} from 'lodash';
import {RaceDetector} from '../../../RaceDetector';
import {StatisticsStore} from '../../StatisticsStore';

export class PrimitiveDeclaration extends ResourceDeclaration
{
    public readonly iid: number;
    public readonly name: string;
    public readonly typeWhenDefined: 'function' | 'var';

    /** used for finding correct function call */
    public readonly functionWhenDefinedWeakRef: WeakRef<Function> | null;

    private readonly asyncContextToOperations: Map<AsyncCalledFunctionInfo, PrimitiveOperation[]>;
    private scope: Scope | null;    // null for pending ones

    constructor(iid: number, name: string, typeWhenDefined: 'function', scope: Scope | null, func: Function)
    constructor(iid: number, name: string, typeWhenDefined: 'var', scope: Scope | null)
    constructor(iid: number, name: string, typeWhenDefined: 'function' | 'var', scope: Scope | null, func?: Function)
    {
        super();
        this.iid = iid;
        this.name = name;
        this.typeWhenDefined = typeWhenDefined;
        this.scope = scope;
        this.asyncContextToOperations = new Map();

        if (typeWhenDefined === 'function' && isFunction(func))
        {
            this.functionWhenDefinedWeakRef = new WeakRef(func);
        }
        else
        {
            this.functionWhenDefinedWeakRef = null;
        }

        StatisticsStore.addPrimitiveCount();
    }

    public getScope()
    {
        return this.scope;
    }

    public setScope(scope: Scope)
    {
        this.scope = scope;
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
        return name === this.name;
    }
}