// DO NOT INSTRUMENT

import {RaceDetector} from '../../../RaceDetector';
import {AsyncCalledFunctionInfo} from '../../Class/AsyncCalledFunctionInfo';
import {ResourceDeclaration} from '../../Class/ResourceDeclaration';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {FileInfo} from './FileInfo';
import {FileOperation} from './FileOperation';

export class FileDeclaration extends ResourceDeclaration
{
    private readonly fileInfo: FileInfo;
    private readonly asyncContextToOperations: Map<AsyncCalledFunctionInfo, FileOperation[]>;

    constructor(filePath: string, possibleDefineCodeScope: SourceCodeInfo | null)
    {
        super();
        this.fileInfo = new FileInfo(filePath, possibleDefineCodeScope);
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