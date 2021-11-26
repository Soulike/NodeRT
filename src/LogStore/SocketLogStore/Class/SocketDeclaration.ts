// DO NOT INSTRUMENT

import net from 'net';
import {RaceDetector} from '../../../RaceDetector';
import {AsyncCalledFunctionInfo} from '../../Class/AsyncCalledFunctionInfo';
import {ResourceDeclaration} from '../../Class/ResourceDeclaration';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {SocketInfo} from './SocketInfo';
import {SocketOperation} from './SocketOperation';

export class SocketDeclaration extends ResourceDeclaration
{
    private readonly socketInfo: SocketInfo;
    private readonly asyncContextToOperations: Map<AsyncCalledFunctionInfo, SocketOperation[]>;

    constructor(socket: net.Socket, possibleDefineCodeScope: SourceCodeInfo | null)
    {
        super();
        this.socketInfo = new SocketInfo(socket, possibleDefineCodeScope);
        this.asyncContextToOperations = new Map();
    }

    public appendOperation(currentCallbackFunction: AsyncCalledFunctionInfo, socketOperation: SocketOperation): void
    {
        const operations = this.asyncContextToOperations.get(currentCallbackFunction);
        if (operations === undefined)
        {
            this.asyncContextToOperations.set(currentCallbackFunction, [socketOperation]);
        }
        else
        {
            operations.push(socketOperation);
        }
        RaceDetector.emit('operationAppended', this);
    }

    public getAsyncContextToOperations(): ReadonlyMap<AsyncCalledFunctionInfo, SocketOperation[]>
    {
        return this.asyncContextToOperations;
    }

    public is(other: unknown): boolean
    {
        return this.socketInfo.is(other);
    }

    public override getResourceInfo(): SocketInfo
    {
        return this.socketInfo;
    }
}