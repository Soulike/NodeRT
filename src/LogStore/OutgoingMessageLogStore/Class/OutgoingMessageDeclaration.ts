// DO NOT INSTRUMENT

import http from 'http';
import {RaceDetector} from '../../../RaceDetector';
import {AsyncCalledFunctionInfo} from '../../Class/AsyncCalledFunctionInfo';
import {ResourceDeclaration} from '../../Class/ResourceDeclaration';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {OutgoingMessageInfo} from './OutgoingMessageInfo';
import {OutgoingMessageOperation} from './OutgoingMessageOperation';

export class OutgoingMessageDeclaration extends ResourceDeclaration
{
    private readonly outgoingMessageInfo: OutgoingMessageInfo;
    private readonly asyncContextToOperations: Map<AsyncCalledFunctionInfo, OutgoingMessageOperation[]>;

    constructor(outgoingMessage: http.OutgoingMessage, possibleDefineCodeScope: SourceCodeInfo | null)
    {
        super();
        this.outgoingMessageInfo = new OutgoingMessageInfo(outgoingMessage, possibleDefineCodeScope);
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