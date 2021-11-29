import {ResourceInfo} from '../../Class/ResourceInfo';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {StatisticsStore} from '../../StatisticsStore';
import {isRunningUnitTests} from '../../../Util';

export class ObjectInfo extends ResourceInfo
{
    private readonly objectWeakRef: WeakRef<object>;

    constructor(object: object, possibleDefineCodeScope: SourceCodeInfo | null)
    {
        super('object', possibleDefineCodeScope);
        this.objectWeakRef = new WeakRef(object);
        StatisticsStore.addObjectCount();
    }

    public override getHash(): object | string
    {
        if (isRunningUnitTests())
        {
            return JSON.stringify({
                ...this,
                objectWeakRef: undefined,
            });
        }
        else
        {
            return this;
        }
    }

    public is(other: unknown): boolean
    {
        return this.objectWeakRef.deref() === other;
    }

    public toJSON()
    {
        const object = this.objectWeakRef.deref();
        let objectType = object === undefined
            ? '[GarbageCollectedObject]'
            : `${Object.prototype.toString.apply(object)}`;
        return {
            ...this,
            objectWeakRef: objectType,
        };
    }

    public getObject()
    {
        return this.objectWeakRef.deref();
    }
}