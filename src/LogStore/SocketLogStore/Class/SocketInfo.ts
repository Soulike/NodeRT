import {ResourceInfo} from '../../Class/ResourceInfo';
import net from 'net';
import {StatisticsStore} from '../../StatisticsStore';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';

export class SocketInfo extends ResourceInfo
{
    private readonly socketWeakRef: WeakRef<net.Socket>;

    constructor(socket: net.Socket, possibleDefineCodeScope: SourceCodeInfo)
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