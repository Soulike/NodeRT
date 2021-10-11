// DO NOT INSTRUMENT

import {ResourceDeclaration} from '../../Class/ResourceDeclaration';
import {CallbackFunction} from '../../Class/CallbackFunction';
import {FileOperation} from './FileOperation';
import {RaceDetector} from '../../../RaceDetector';
import {StatisticsStore} from '../../StatisticsStore';

export class FileDeclaration extends ResourceDeclaration
{
    private readonly filePath: string;
    private readonly callbackFunctionToOperations: Map<CallbackFunction, FileOperation[]>;

    constructor(filePath: string)
    {
        super();
        this.filePath = filePath;
        this.callbackFunctionToOperations = new Map();
        StatisticsStore.addFileCount();
    }

    public appendOperation(currentCallbackFunction: CallbackFunction, fileOperation: FileOperation): void
    {
        const operations = this.callbackFunctionToOperations.get(currentCallbackFunction);
        if (operations === undefined)
        {
            this.callbackFunctionToOperations.set(currentCallbackFunction, [fileOperation]);
        }
        else
        {
            operations.push(fileOperation);
        }
        RaceDetector.emit('operationAppended', this);
    }

    public override getCallbackFunctionToOperations(): ReadonlyMap<CallbackFunction, FileOperation[]>
    {
        return this.callbackFunctionToOperations;
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