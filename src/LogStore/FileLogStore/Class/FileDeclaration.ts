// DO NOT INSTRUMENT

import {ResourceDeclaration} from '../../Class/ResourceDeclaration';
import {CallbackFunction} from '../../Class/CallbackFunction';
import {FileOperation} from './FileOperation';
import {BufferLogStore} from '../../BufferLogStore';
import {strict as assert} from 'assert';
import {isBufferLike} from '../../../Util';
import {BufferLike} from '../../../Analysis/Type/BufferLike';

export class FileDeclaration extends ResourceDeclaration
{
    private readonly filePath: string | BufferLike;
    private readonly callbackFunctionToOperations?: Map<CallbackFunction, FileOperation[]>;  // undefined if filePath is a Buffer

    constructor(filePath: string | BufferLike)
    {
        super();
        this.filePath = filePath;
        if (!isBufferLike(filePath))
        {
            this.callbackFunctionToOperations = new Map();
        }
    }

    public appendOperation(currentCallbackFunction: CallbackFunction, fileOperation: FileOperation): void
    {
        if (isBufferLike(this.filePath))
        {
            assert.ok(this.callbackFunctionToOperations === undefined);
            BufferLogStore.appendBufferOperation(this.filePath, fileOperation.getType(), fileOperation.getSourceCodeInfo());
        }
        else
        {
            assert.ok(this.callbackFunctionToOperations !== undefined);
            const operations = this.callbackFunctionToOperations.get(currentCallbackFunction);
            if (operations === undefined)
            {
                this.callbackFunctionToOperations.set(currentCallbackFunction, [fileOperation]);
            }
            else
            {
                operations.push(fileOperation);
            }
        }
    }

    public getOperations(): ReadonlyMap<CallbackFunction, FileOperation[]>
    {
        return this.callbackFunctionToOperations ?? new Map();
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