import {ResourceInfo} from '../../Class/ResourceInfo';
import dgram from 'dgram';
import net from 'net';
import {StatisticsStore} from '../../StatisticsStore';

export class SocketInfo extends ResourceInfo
{
    private readonly socketWeakRef: WeakRef<dgram.Socket | net.Socket>;

    constructor(socket: dgram.Socket | net.Socket)
    {
        super('socket');
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
            socketWeakRef: undefined,
        };
    }
}