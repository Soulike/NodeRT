// DO NOT INSTRUMENT

import Analysis from '../../Type/Analysis';
import Sandbox from '../../Type/Sandbox';
import FileDeclaration from './Class/FileDeclaration';
import {FileHandle} from 'fs/promises';
import Hooks from '../../Type/Hooks';
import fs, {PathLike, promises as fsPromise} from 'fs';
import {strict as assert} from 'assert';
import {URL} from 'url';
import CallbackFunctionContext from '../Singleton/CallbackFunctionContext';
import FileOperation from './Class/FileOperation';
import {getSourceCodeInfoFromIid, toJSON} from '../Util';

// TODO: fd 相关 API
class FileOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;

    private readonly fileDeclarations: FileDeclaration[];
    private readonly fileHandles: Set<FileHandle>;

    private readonly filePathToFileDeclaration: Map<string | Buffer, FileDeclaration>;
    private readonly fileHandleToFileDeclaration: Map<FileHandle, FileDeclaration>;

    private readonly readApis: ReadonlySet<Function>;
    private readonly writeApis: ReadonlySet<Function>;
    private readonly readWriteApis: ReadonlySet<Function>;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.fileDeclarations = [];
        this.filePathToFileDeclaration = new Map();
        this.fileHandleToFileDeclaration = new Map();
        this.fileHandles = new Set();

        this.readApis = new Set([
            fsPromise.access,
            fsPromise.lstat,
            fsPromise.readdir,
            fsPromise.readFile,
            fsPromise.readlink,
            fsPromise.realpath,
            fsPromise.stat,
            fsPromise.read,

            fs.access,
            fs.createReadStream,
            fs.exists,
            fs.lstat,
            fs.readdir,
            fs.readFile,
            fs.readlink,
            fs.realpath,
            fs.stat,
            fs.read,

            fs.accessSync,
            fs.existsSync,
            fs.lstatSync,
            fs.readdirSync,
            fs.readFileSync,
            fs.readlinkSync,
            fs.realpathSync,
            fs.statSync,
            fs.readSync,
        ]);
        this.writeApis = new Set([
            fsPromise.appendFile,
            fsPromise.chmod,
            fsPromise.chown,
            fsPromise.lchmod,
            fsPromise.lchown,
            fsPromise.lutimes,
            fsPromise.mkdir,
            fsPromise.rmdir,
            fsPromise.rm,
            fsPromise.truncate,
            fsPromise.unlink,
            fsPromise.utimes,
            fsPromise.writeFile,
            fsPromise.write,

            fs.appendFile,
            fs.chmod,
            fs.chown,
            fs.createWriteStream,
            fs.lchmod,
            fs.lchown,
            fs.lutimes,
            fs.mkdir,
            fs.rmdir,
            fs.rm,
            fs.truncate,
            fs.unlink,
            fs.utimes,
            fs.writeFile,
            fs.write,

            fs.appendFileSync,
            fs.chmodSync,
            fs.chownSync,
            fs.lchmodSync,
            fs.lchownSync,
            fs.lutimesSync,
            fs.mkdirSync,
            fs.rmdirSync,
            fs.rmSync,
            fs.truncateSync,
            fs.unlinkSync,
            fs.utimesSync,
            fs.writeFileSync,
            fs.writeSync,
        ]);
        this.readWriteApis = new Set([
            fsPromise.copyFile,
            fsPromise.link,
            fsPromise.rename,
            fsPromise.symlink,

            fs.copyFile,
            fs.link,
            fs.rename,
            fs.symlink,

            fs.copyFileSync,
            fs.linkSync,
            fs.renameSync,
            fs.symlinkSync,
        ]);

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
                    const fileDeclaration = this.getFileDeclarationFromFilePath(filePath);
                    this.fileHandleToFileDeclaration.set(fileHandle, fileDeclaration);
                });
            }
            else if (this.fileHandles.has(base as FileHandle))
            {
                const fileHandle = base as FileHandle;
                const fileDeclaration = this.fileHandleToFileDeclaration.get(fileHandle);
                assert(fileDeclaration !== undefined);
                const fileHandleWriteApis: ReadonlySet<Function> = new Set([
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
                const fileHandleReadApis: ReadonlySet<Function> = new Set([
                    fileHandle.read,
                    fileHandle.readFile,
                    fileHandle.readv,
                    fileHandle.stat,
                ]);
                const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
                const sandbox = this.getSandbox();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);
                if (fileHandleWriteApis.has(f))
                {
                    fileDeclaration.appendOperation(currentCallbackFunction, new FileOperation('write', sourceCodeInfo));
                }
                else if (fileHandleReadApis.has(f))
                {
                    fileDeclaration.appendOperation(currentCallbackFunction, new FileOperation('read', sourceCodeInfo));
                }
            }
            else if (this.readApis.has(f))
            {
                const path = args[0] as PathLike | FileHandle;
                const fileDeclaration = this.getFileDeclarationFromFilePath(path);
                const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
                const sandbox = this.getSandbox();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);
                fileDeclaration.appendOperation(currentCallbackFunction, new FileOperation('read', sourceCodeInfo));
            }
            else if (this.writeApis.has(f))
            {
                const path = args[0] as PathLike | FileHandle;
                const fileDeclaration = this.getFileDeclarationFromFilePath(path);
                const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
                const sandbox = this.getSandbox();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);
                fileDeclaration.appendOperation(currentCallbackFunction, new FileOperation('write', sourceCodeInfo));
            }
            else if (this.readWriteApis.has(f))
            {
                const srcPath = args[0] as PathLike | FileHandle;
                const distPath = args[1] as PathLike | FileHandle;
                const srcFileDeclaration = this.getFileDeclarationFromFilePath(srcPath);
                const distFileDeclaration = this.getFileDeclarationFromFilePath(distPath);
                const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
                const sandbox = this.getSandbox();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);
                srcFileDeclaration.appendOperation(currentCallbackFunction, new FileOperation('read', sourceCodeInfo));
                distFileDeclaration.appendOperation(currentCallbackFunction, new FileOperation('write', sourceCodeInfo));
            }
            else if (f === fsPromise.mkdtemp)
            {
                assert.ok(result instanceof Promise);
                result.then(filePath =>
                {
                    assert.ok(typeof filePath === 'string');
                    const fileDeclaration = this.getFileDeclarationFromFilePath(filePath);
                    const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
                    const sandbox = this.getSandbox();
                    const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);
                    fileDeclaration.appendOperation(currentCallbackFunction, new FileOperation('write', sourceCodeInfo));
                });
            }
            else if (f === fs.mkdtempSync)
            {
                const filePath = result;
                assert.ok(typeof filePath === 'string');
                const fileDeclaration = this.getFileDeclarationFromFilePath(filePath);
                const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
                const sandbox = this.getSandbox();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);
                fileDeclaration.appendOperation(currentCallbackFunction, new FileOperation('write', sourceCodeInfo));
            }
        };
    }

    private onAnalysisExit()
    {
        console.log(toJSON(this.fileDeclarations));
    }

    private getFileDeclarationFromFilePath(filePath: PathLike | FileHandle): FileDeclaration
    {
        if (filePath instanceof Buffer || typeof filePath === 'string')
        {
            const fileDeclaration = this.filePathToFileDeclaration.get(filePath);
            if (fileDeclaration === undefined)
            {
                const newFileDeclaration = new FileDeclaration(filePath);
                this.fileDeclarations.push(newFileDeclaration);
                this.filePathToFileDeclaration.set(filePath, newFileDeclaration);
                return newFileDeclaration;
            }
            else
            {
                return fileDeclaration;
            }
        }
        else if (filePath instanceof URL)
        {
            const realFilePath = filePath.href;
            const fileDeclaration = this.filePathToFileDeclaration.get(realFilePath);
            if (fileDeclaration === undefined)
            {
                const newFileDeclaration = new FileDeclaration(realFilePath);
                this.fileDeclarations.push(newFileDeclaration);
                this.filePathToFileDeclaration.set(realFilePath, newFileDeclaration);
                return newFileDeclaration;
            }
            else
            {
                return fileDeclaration;
            }
        }
        else    // FileHandle
        {
            const fileDeclaration = this.fileHandleToFileDeclaration.get(filePath);
            assert.ok(fileDeclaration !== undefined);
            return fileDeclaration;
        }
    }
}

export default FileOperationLogger;