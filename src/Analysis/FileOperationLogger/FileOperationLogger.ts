// DO NOT INSTRUMENT

import Analysis from '../../Type/Analysis';
import Sandbox from '../../Type/Sandbox';
import FileDeclaration from './Class/FileDeclaration';
import {FileHandle} from 'fs/promises';
import Hooks from '../../Type/Hooks';
import {promises as fsPromise} from 'fs';
import {strict as assert} from 'assert';
import {URL} from 'url';

class FileOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;

    private readonly fileDeclarations: FileDeclaration[];
    private readonly filePathToFileDeclaration: Map<string | Buffer, FileDeclaration>;
    private readonly fileHandleToFileDeclaration: Map<FileHandle, FileDeclaration>;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.fileDeclarations = [];
        this.filePathToFileDeclaration = new Map();
        this.fileHandleToFileDeclaration = new Map();
    }

    protected override registerHooks(): void
    {
        this.invokeFun = (iid, f, base, args, result, isConstructor, isMethod, functionIid, functionSid) =>
        {
            if (f === fsPromise.open)
            {
                assert.ok(result instanceof Promise);
                result.then(fileHandle =>
                {
                    assert.ok(typeof args[0] === 'string' || args[0] instanceof Buffer || args[0] instanceof URL);
                    const filePath = args[0] as string | Buffer | URL;
                    if (filePath instanceof Buffer)
                    {
                        const newFileDeclaration = new FileDeclaration(filePath);
                        this.fileDeclarations.push(newFileDeclaration);
                        this.fileHandleToFileDeclaration.set(fileHandle, newFileDeclaration);
                        this.filePathToFileDeclaration.set(filePath, newFileDeclaration);
                    }
                    else
                    {
                        const realFilePath = typeof filePath === 'string' ? filePath : filePath.href;
                        const fileDeclaration = this.filePathToFileDeclaration.get(realFilePath);
                        if (fileDeclaration === undefined)
                        {
                            const newFileDeclaration = new FileDeclaration(realFilePath);
                            this.fileDeclarations.push(newFileDeclaration);
                            this.fileHandleToFileDeclaration.set(fileHandle, newFileDeclaration);
                            this.filePathToFileDeclaration.set(realFilePath, newFileDeclaration);
                        }
                        else
                        {
                            this.fileHandleToFileDeclaration.set(fileHandle, fileDeclaration);
                        }
                    }
                });
            }
        };
    }
}

export default FileOperationLogger;