// DO NOT INSTRUMENT

import {ResourceDeclaration} from '../../Class/ResourceDeclaration';
import {CallbackFunction} from '../../Class/CallbackFunction';
import {SocketOperation} from './SocketOperation';
import dgram from 'dgram';
import net from 'net';

export class SocketDeclaration extends ResourceDeclaration
{
    private readonly socketWeakRef: WeakRef<dgram.Socket | net.Socket>;
    private readonly operations: Map<CallbackFunction, SocketOperation[]>;

    constructor(socket: dgram.Socket | net.Socket)
    {
        super();
        this.socketWeakRef = new WeakRef(socket);
        this.operations = new Map();
    }

    public appendOperation(currentCallbackFunction: CallbackFunction, socketOperation: SocketOperation): void
    {
        const operations = this.operations.get(currentCallbackFunction);
        if (operations === undefined)
        {
            this.operations.set(currentCallbackFunction, [socketOperation]);
        }
        else
        {
            operations.push(socketOperation);
        }
    }

    public getCallbackFunctionToOperations(): ReadonlyMap<CallbackFunction, SocketOperation[]>
    {
        return this.operations;
    }

    public is(other: unknown): boolean
    {
        return this.socketWeakRef.deref() === other;
    }

    public toJSON()
    {
        return {
            ...this,
            socketWeakRef: '<Socket>'
        };
    }
}