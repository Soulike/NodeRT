// DO NOT INSTRUMENT

import {ResourceDeclaration} from '../../Class/ResourceDeclaration';
import {AsyncCalledFunctionInfo} from '../../Class/AsyncCalledFunctionInfo';
import {FileOperation} from './FileOperation';
import {RaceDetector} from '../../../RaceDetector';
import {StatisticsStore} from '../../StatisticsStore';

export class FileDeclaration extends ResourceDeclaration
{
    private readonly filePath: string;
    private readonly asyncContextToOperations: Map<AsyncCalledFunctionInfo, FileOperation[]>;

    constructor(filePath: string)
    {
        super();
        this.filePath = filePath;
        this.asyncContextToOperations = new Map();
        StatisticsStore.addFileCount();
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

    public getFilePath()
    {
        return this.filePath;
    }

    public is(filePath: string): boolean
    {
        return this.filePath === filePath;
    }
}