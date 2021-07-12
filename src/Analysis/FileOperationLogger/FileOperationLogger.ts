// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import FileDeclaration from './Class/FileDeclaration';
import {FileHandle} from 'fs/promises';
import fs, {PathLike, promises as fsPromise} from 'fs';
import {strict as assert} from 'assert';
import {URL} from 'url';
import CallbackFunctionContext from '../Singleton/CallbackFunctionContext';
import FileOperation from './Class/FileOperation';
import {getSourceCodeInfoFromIid, toJSON} from '../Util';

class FileOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public functionEnter: Hooks['functionEnter'] | undefined;

    private readonly fileDeclarations: FileDeclaration[];
    private readonly fileHandles: Set<FileHandle>;

    private readonly filePathToFileDeclaration: Map<string | Buffer, FileDeclaration>;
    private readonly fileHandleToFileDeclaration: Map<FileHandle, FileDeclaration>;

    private readonly fdToFileDeclaration: Map<number, FileDeclaration>;
    private readonly callbackToFileDeclaration: Map<Function, FileDeclaration>;

    private readonly readApis: ReadonlySet<(path: PathLike & FileHandle, ...rest: any[]) => any>;
    private readonly writeApis: ReadonlySet<(path: PathLike & FileHandle, ...rest: any[]) => any>;
    private readonly readWriteApis: ReadonlySet<(src: PathLike, dist: PathLike, ...rest: any[]) => any>;

    private readonly fdReadApis: ReadonlySet<(fd: number, ...rest: any[]) => any>;
    private readonly fdWriteApis: ReadonlySet<(fd: number, ...rest: any[]) => any>;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.fileDeclarations = [];
        this.filePathToFileDeclaration = new Map();
        this.fileHandleToFileDeclaration = new Map();
        this.fileHandles = new Set();
        this.fdToFileDeclaration = new Map();
        this.callbackToFileDeclaration = new Map();

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

            fs.accessSync,
            fs.existsSync,
            fs.lstatSync,
            fs.readdirSync,
            fs.readFileSync,
            fs.readlinkSync,
            fs.realpathSync,
            fs.statSync,
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

        this.fdReadApis = new Set([
            fs.fstat,
            fs.read,
            fs.readv,

            fs.fstatSync,
            fs.readSync,
            fs.readvSync,
        ]);
        this.fdWriteApis = new Set([
            fs.close,
            fs.fchmod,
            fs.fchown,
            fs.ftruncate,
            fs.futimes,
            fs.write,
            fs.writev,

            fs.closeSync,
            fs.fchmodSync,
            fs.fchownSync,
            fs.ftruncateSync,
            fs.futimesSync,
            fs.writeSync,
            fs.writevSync,
        ]);


        this.registerHooks();

        process.on('exit', () => this.onAnalysisExit());
    }

    protected override registerHooks(): void
    {
        this.invokeFun = (iid, f, base, args, result) =>
        {
            if (f === fsPromise.open)
            {
                assert.ok(result instanceof Promise);
                (<ReturnType<typeof fsPromise.open>>result).then((fileHandle) =>
                {
                    this.fileHandles.add(fileHandle);
                    const filePath = args[0] as Parameters<typeof fsPromise.open>[0];
                    const fileDeclaration = this.getFileDeclarationFromFilePath(filePath);
                    this.fileHandleToFileDeclaration.set(fileHandle, fileDeclaration);
                    this.fdToFileDeclaration.set(fileHandle.fd, fileDeclaration);
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
            // @ts-ignore
            else if (this.readApis.has(f))
            {
                const path = args[0] as PathLike | FileHandle;
                const fileDeclaration = this.getFileDeclarationFromFilePath(path);
                const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
                const sandbox = this.getSandbox();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);
                fileDeclaration.appendOperation(currentCallbackFunction, new FileOperation('read', sourceCodeInfo));
            }
            // @ts-ignore
            else if (this.writeApis.has(f))
            {
                const path = args[0] as PathLike | FileHandle;
                const fileDeclaration = this.getFileDeclarationFromFilePath(path);
                const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
                const sandbox = this.getSandbox();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);
                fileDeclaration.appendOperation(currentCallbackFunction, new FileOperation('write', sourceCodeInfo));
            }
            // @ts-ignore
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
                (<ReturnType<typeof fsPromise.mkdtemp>>result).then((filePath) =>
                {
                    const fileDeclaration = this.getFileDeclarationFromFilePath(filePath);
                    const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
                    const sandbox = this.getSandbox();
                    const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);
                    fileDeclaration.appendOperation(currentCallbackFunction, new FileOperation('write', sourceCodeInfo));
                });
            }
            else if (f === fs.mkdtempSync)
            {
                const filePath = result as ReturnType<typeof fs.mkdtempSync>;
                const fileDeclaration = this.getFileDeclarationFromFilePath(filePath);
                const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
                const sandbox = this.getSandbox();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);
                fileDeclaration.appendOperation(currentCallbackFunction, new FileOperation('write', sourceCodeInfo));
            }
            else if (f === fs.open)
            {
                const filePath = args[0] as Parameters<typeof fs.open>[0];
                const callback = args[args.length - 1] as LastParameter<typeof fs.open>;
                const fileDeclaration = this.getFileDeclarationFromFilePath(filePath);
                this.callbackToFileDeclaration.set(callback, fileDeclaration);  // later processed in functionEnter()
            }
            // @ts-ignore
            else if (this.fdReadApis.has(f))
            {
                const fd = args[0];
                assert.ok(typeof fd === 'number');
                const fileDeclaration = this.fdToFileDeclaration.get(fd);
                const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
                const sandbox = this.getSandbox();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);
                if (fileDeclaration !== undefined) // ignores undefined ones
                {
                    fileDeclaration.appendOperation(currentCallbackFunction, new FileOperation('read', sourceCodeInfo));
                }
            }
            // @ts-ignore
            else if (this.fdWriteApis.has(f))
            {
                const fd = args[0];
                assert.ok(typeof fd === 'number');
                const fileDeclaration = this.fdToFileDeclaration.get(fd);
                const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
                const sandbox = this.getSandbox();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);
                if (fileDeclaration !== undefined) // ignores undefined ones
                {
                    fileDeclaration.appendOperation(currentCallbackFunction, new FileOperation('write', sourceCodeInfo));
                }
            }
        };

        this.functionEnter = (_iid, f, _dis, args) =>
        {
            // process fs.open() callback
            const fileDeclaration = this.callbackToFileDeclaration.get(f);
            if (fileDeclaration !== undefined)
            {
                const err = args[0];
                const fd = args[1];
                if (err === null)
                {
                    assert.ok(typeof fd === 'number');
                    this.fdToFileDeclaration.set(fd, fileDeclaration);
                }
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