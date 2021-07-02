// DO NOT INSTRUMENT

import Analysis from '../../Type/Analysis';
import Sandbox from '../../Type/Sandbox';
import FileDeclaration from './Class/FileDeclaration';
import {FileHandle} from 'fs/promises';
import Hooks from '../../Type/Hooks';
import {promises as fsPromise} from 'fs';
import {strict as assert} from 'assert';
import {URL} from 'url';
import CallbackFunctionContext from '../Singleton/CallbackFunctionContext';
import FileOperation from './Class/FileOperation';
import {getSourceCodeInfoFromIid, toJSON} from '../Util';

class FileOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;

    private readonly fileDeclarations: FileDeclaration[];
    private readonly filePathToFileDeclaration: Map<string | Buffer, FileDeclaration>;
    private readonly fileHandleToFileDeclaration: Map<FileHandle, FileDeclaration>;
    private readonly fileHandles: Set<FileHandle>;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.fileDeclarations = [];
        this.filePathToFileDeclaration = new Map();
        this.fileHandleToFileDeclaration = new Map();
        this.fileHandles = new Set();

        this.registerHooks();

        process.on('exit', () => this.onAnalysisExit());
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
                    this.fileHandles.add(fileHandle);
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
            else if (this.fileHandles.has(base as FileHandle))
            {
                const fileHandle = base as FileHandle;
                const fileDeclaration = this.fileHandleToFileDeclaration.get(fileHandle);
                assert(fileDeclaration !== undefined);
                const writeApis: Set<Function> = new Set([
                    fileHandle.appendFile,
                    fileHandle.chmod,
                    fileHandle.chown,
                    fileHandle.close,
                    fileHandle.datasync,
                    fileHandle.sync,
                    fileHandle.truncate,
                    fileHandle.utimes,
                    fileHandle.write,
                    fileHandle.writeFile,
                    fileHandle.writev,
                ]);
                const readApis: Set<Function> = new Set([
                    fileHandle.read,
                    fileHandle.readFile,
                    fileHandle.readv,
                    fileHandle.stat,
                ]);
                const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
                const sandbox = this.getSandbox();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);
                if (writeApis.has(f))
                {
                    fileDeclaration.appendOperation(currentCallbackFunction, new FileOperation('write', sourceCodeInfo));
                }
                else if (readApis.has(f))
                {
                    fileDeclaration.appendOperation(currentCallbackFunction, new FileOperation('read', sourceCodeInfo));
                }
            }
        };
    }

    private onAnalysisExit()
    {
        console.log(toJSON(this.fileDeclarations));
    }
}

export default FileOperationLogger;