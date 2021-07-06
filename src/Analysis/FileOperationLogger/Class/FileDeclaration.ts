// DO NOT INSTRUMENT

import ResourceDeclaration from '../../Class/ResourceDeclaration';
import CallbackFunction from '../../Class/CallbackFunction';
import FileOperation from './FileOperation';
import BufferLogger, {BufferDeclaration, BufferOperation} from '../../Singleton/BufferLogger';
import {strict as assert} from 'assert';

class FileDeclaration extends ResourceDeclaration
{
    private readonly filePath: string | Buffer;
    private readonly bufferDeclaration: BufferDeclaration | null; // created if filePath is a Buffer
    private readonly callbackFunctionToOperations: Map<CallbackFunction, FileOperation[]>;  // unused if filePath is a Buffer

    constructor(filePath: string | Buffer)
    {
        super();
        this.filePath = filePath;
        this.callbackFunctionToOperations = new Map();

        if (this.filePath instanceof Buffer)
        {
            this.bufferDeclaration = BufferLogger.getBufferDeclaration(this.filePath);
        }
        else
        {
            this.bufferDeclaration = null;
        }
    }

    public appendOperation(currentCallbackFunction: CallbackFunction, fileOperation: FileOperation): void
    {
        if (this.filePath instanceof Buffer)
        {
            assert.ok(this.bufferDeclaration !== null);
            const bufferOperation = new BufferOperation(fileOperation.getType(), fileOperation.getSourceCodeInfo());
            this.bufferDeclaration.appendOperation(currentCallbackFunction, bufferOperation);
        }
        else
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
        }
    }

    public getOperations(): ReadonlyMap<CallbackFunction, FileOperation[]>
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

export default FileDeclaration;