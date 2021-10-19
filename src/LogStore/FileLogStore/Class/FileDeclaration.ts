// DO NOT INSTRUMENT

import {ResourceDeclaration} from '../../Class/ResourceDeclaration';
import {AsyncCalledFunctionInfo} from '../../Class/AsyncCalledFunctionInfo';
import {FileOperation} from './FileOperation';
import {RaceDetector} from '../../../RaceDetector';
import {FileInfo} from './FileInfo';

export class FileDeclaration extends ResourceDeclaration
{
    private readonly fileInfo: FileInfo;
    private readonly asyncContextToOperations: Map<AsyncCalledFunctionInfo, FileOperation[]>;

    constructor(filePath: string)
    {
        super();
        this.fileInfo = new FileInfo(filePath);
        this.asyncContextToOperations = new Map();
    }

    public override getResourceInfo(): FileInfo
    {
        return this.fileInfo;
    }

    public appendOperation(currentCallbackFunction: AsyncCalledFunctionInfo, fileOperation: FileOperation): void
    {
        const operations = this.asyncContextToOperations.get(currentCallbackFunction);
        if (operations === undefined)
        {
            this.asyncContextToOperations.set(currentCallbackFunction, [fileOperation]);
        }
        else
        {
            operations.push(fileOperation);
        }
        RaceDetector.emit('operationAppended', this);
    }

    public override getAsyncContextToOperations(): ReadonlyMap<AsyncCalledFunctionInfo, FileOperation[]>
    {
        return this.asyncContextToOperations;
    }

    public is(filePath: string): boolean
    {
        return this.fileInfo.is(filePath);
    }
}