// DO NOT INSTRUMENT

import ResourceDeclaration from '../../Class/ResourceDeclaration';
import CallbackFunction from '../../Class/CallbackFunction';
import FileOperation from './FileOperation';

class FileDeclaration extends ResourceDeclaration
{
    private readonly filePath: string | Buffer;
    private readonly callbackFunctionToOperations: Map<CallbackFunction, FileOperation[]>;

    constructor(filePath: string | Buffer)
    {
        super();
        this.filePath = filePath;
        this.callbackFunctionToOperations = new Map();
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
    }

    public getOperations(): ReadonlyMap<CallbackFunction, FileOperation[]>
    {
        return this.callbackFunctionToOperations;
    }

    public getFilePath()
    {
        return this.filePath;
    }

    public is(filePath: string | Buffer): boolean
    {
        if (filePath instanceof Buffer)
        {
            return this.filePath === filePath;
        }
        return this.filePath === filePath;
    }
}

export default FileDeclaration;