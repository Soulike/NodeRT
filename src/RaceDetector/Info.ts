import {ResourceInfo} from '../LogStore/Class/ResourceInfo';

export abstract class Info
{
    public readonly resourceInfo: ResourceInfo;

    protected constructor(resourceInfo: ResourceInfo)
    {
        this.resourceInfo = resourceInfo;
    }
}