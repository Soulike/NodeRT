import {isFunction} from 'lodash';
import {ResourceInfo} from '../../Class/ResourceInfo';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {StatisticsStore} from '../../StatisticsStore';
import {Scope} from './Scope';

export class PrimitiveInfo extends ResourceInfo
{
    private readonly iid: number;
    private readonly name: string;
    private readonly typeWhenDefined: 'function' | 'var';

    /** used for finding correct function call */
    private readonly functionWhenDefinedWeakRef: WeakRef<Function> | null;

    private scope: Scope | null;    // null for pending ones

    constructor(iid: number, name: string, typeWhenDefined: 'function' | 'var', scope: Scope | null, possibleDefineCodeScope: SourceCodeInfo | null, func?: Function)
    {
        super('primitive', possibleDefineCodeScope);
        this.iid = iid;
        this.name = name;
        this.typeWhenDefined = typeWhenDefined;
        this.scope = scope;

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

    override getHash(): string
    {
        return JSON.stringify({
            type: this.getType(),
            iid: this.iid,
            name: this.name,
            typeWhenDefined: this.typeWhenDefined,
            possibleDefineCodeScope: this.getPossibleDefineCodeScope(),
        });
    }

    public getScope()
    {
        return this.scope;
    }

    public setScope(scope: Scope)
    {
        this.scope = scope;
    }

    public getIid()
    {
        return this.iid;
    }

    public getTypeWhenDefined()
    {
        return this.typeWhenDefined;
    }

    public getName()
    {
        return this.name;
    }

    public getFunctionWhenDefinedWeakRef()
    {
        return this.functionWhenDefinedWeakRef;
    }

    public is(name: string): boolean
    {
        return name === this.name;
    }

    public toJSON()
    {
        return {
            ...this,
            functionWhenDefinedWeakRef: undefined,
        };
    }
}