import net from 'net';
import {ResourceInfo} from '../../Class/ResourceInfo';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {StatisticsStore} from '../../StatisticsStore';

export class SocketInfo extends ResourceInfo
{
    private readonly socketWeakRef: WeakRef<net.Socket>;

    constructor(socket: net.Socket, possibleDefineCodeScope: SourceCodeInfo | null)
    {
        super('socket', possibleDefineCodeScope);
        this.socketWeakRef = new WeakRef(socket);
        StatisticsStore.addSocketCount();
    }

    public getSocketWeakRef()
    {
        return this.socketWeakRef;
    }

    public is(other: unknown)
    {
        return other === this.socketWeakRef.deref();
    }

    public toJSON()
    {
        return {
            ...this,
            remoteAddress: this.socketWeakRef.deref()?.address(),
            socketWeakRef: undefined,
        };
    }
}