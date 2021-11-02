import {ResourceInfo} from '../../Class/ResourceInfo';
import {StatisticsStore} from '../../StatisticsStore';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';

export class ObjectInfo extends ResourceInfo
{
    private readonly objectWeakRef: WeakRef<object>;

    constructor(object: object, possibleDefineCodeScope: SourceCodeInfo)
    {
        super('object', possibleDefineCodeScope);
        this.objectWeakRef = new WeakRef(object);
        StatisticsStore.addObjectCount();
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
}