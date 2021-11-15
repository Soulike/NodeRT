import http from 'http';
import { ResourceInfo } from '../../Class/ResourceInfo';
import { SourceCodeInfo } from '../../Class/SourceCodeInfo';
import { StatisticsStore } from '../../StatisticsStore';

export class OutgoingMessageInfo extends ResourceInfo
{
    private readonly outgoingMessageWeakRef: WeakRef<http.OutgoingMessage>;

    constructor(outgoingMessage: http.OutgoingMessage, possibleDefineCodeScope: SourceCodeInfo|null)
    {
        super('outgoingMessage', possibleDefineCodeScope);
        this.outgoingMessageWeakRef = new WeakRef(outgoingMessage);
        StatisticsStore.addOutgoingMessageCount();
    }

    public getOutgoingMessageWeakRef()
    {
        return this.outgoingMessageWeakRef;
    }

    public is(other: unknown)
    {
        return other === this.outgoingMessageWeakRef.deref();
    }

    public toJSON()
    {
        return {
            ...this,
            outgoingMessageWeakRef: undefined,
        };
    }
}