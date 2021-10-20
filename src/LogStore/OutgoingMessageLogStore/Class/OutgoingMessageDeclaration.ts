// DO NOT INSTRUMENT

import {ResourceDeclaration} from '../../Class/ResourceDeclaration';
import {AsyncCalledFunctionInfo} from '../../Class/AsyncCalledFunctionInfo';
import {OutgoingMessageOperation} from './OutgoingMessageOperation';
import {RaceDetector} from '../../../RaceDetector';
import {OutgoingMessageInfo} from './OutgoingMessageInfo';
import http from 'http';

export class OutgoingMessageDeclaration extends ResourceDeclaration
{
    private readonly outgoingMessageInfo: OutgoingMessageInfo;
    private readonly asyncContextToOperations: Map<AsyncCalledFunctionInfo, OutgoingMessageOperation[]>;

    constructor(outgoingMessage: http.OutgoingMessage)
    {
        super();
        this.outgoingMessageInfo = new OutgoingMessageInfo(outgoingMessage);
        this.asyncContextToOperations = new Map();
    }

    public appendOperation(currentCallbackFunction: AsyncCalledFunctionInfo, outgoingMessageOperation: OutgoingMessageOperation): void
    {
        const operations = this.asyncContextToOperations.get(currentCallbackFunction);
        if (operations === undefined)
        {
            this.asyncContextToOperations.set(currentCallbackFunction, [outgoingMessageOperation]);
        }
        else
        {
            operations.push(outgoingMessageOperation);
        }
        RaceDetector.emit('operationAppended', this);
    }

    public getAsyncContextToOperations(): ReadonlyMap<AsyncCalledFunctionInfo, OutgoingMessageOperation[]>
    {
        return this.asyncContextToOperations;
    }

    public is(other: unknown): boolean
    {
        return this.outgoingMessageInfo.is(other);
    }

    public override getResourceInfo(): OutgoingMessageInfo
    {
        return this.outgoingMessageInfo;
    }
}