// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {FileDeclaration, FileLogStore} from '../../LogStore/FileLogStore';
import {FileHandle} from 'fs/promises';
import fs, {PathLike, promises as fsPromise} from 'fs';
import {strict as assert} from 'assert';

// TODO: 涉及 Buffer 和数组的 API 建模
export class FileOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public functionEnter: Hooks['functionEnter'] | undefined;

    // Log information of callback apis
    private readonly callbackToFileDeclarationInfo: Map<Function, { register: Function, fileDeclaration?: FileDeclaration }>;

    private readonly readApis: ReadonlySet<(path: PathLike & FileHandle, ...rest: any[]) => any>;
    private readonly writeApis: ReadonlySet<(path: PathLike & FileHandle, ...rest: any[]) => any>;
    private readonly readWriteApis: ReadonlySet<(src: PathLike, dist: PathLike, ...rest: any[]) => any>;

    private readonly fdReadApis: ReadonlySet<(fd: number, ...rest: any[]) => any>;
    private readonly fdWriteApis: ReadonlySet<(fd: number, ...rest: any[]) => any>;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.callbackToFileDeclarationInfo = new Map();

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
    }

    protected override registerHooks(): void
    {
        /*
        * No need to specially log operations on `BufferLike`s. See `FileDeclaration`.
        * */
        this.invokeFun = (iid, f, base, args, result) =>
        {
            if (f === fsPromise.open)
            {
                assert.ok(result instanceof Promise);
                (<ReturnType<typeof fsPromise.open>>result).then((fileHandle) =>
                {
                    const filePath = args[0] as Parameters<typeof fsPromise.open>[0];
                    const fileDeclaration = FileLogStore.getFileDeclarationByFilePathLike(filePath);
                    FileLogStore.addFileHandle(fileHandle, fileDeclaration);
                    FileLogStore.addFd(fileHandle.fd, fileDeclaration);
                });
            }
            else if (FileLogStore.getFileHandles().has(base as FileHandle))
            {
                const fileHandle = base as FileHandle;
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
                if (fileHandleWriteApis.has(f))
                {
                    FileLogStore.appendFileOperation(fileHandle, 'write', this.getSandbox(), iid);
                }
                else if (fileHandleReadApis.has(f))
                {
                    FileLogStore.appendFileOperation(fileHandle, 'read', this.getSandbox(), iid);
                }
            }
            // @ts-ignore
            else if (this.readApis.has(f))
            {
                const path = args[0] as PathLike | FileHandle;
                FileLogStore.appendFileOperation(path, 'read', this.getSandbox(), iid);
            }
            // @ts-ignore
            else if (this.writeApis.has(f))
            {
                const path = args[0] as PathLike | FileHandle;
                FileLogStore.appendFileOperation(path, 'write', this.getSandbox(), iid);
            }
            // @ts-ignore
            else if (this.readWriteApis.has(f))
            {
                const srcPath = args[0] as PathLike | FileHandle;
                const distPath = args[1] as PathLike | FileHandle;
                FileLogStore.appendFileOperation(srcPath, 'read', this.getSandbox(), iid);
                FileLogStore.appendFileOperation(distPath, 'write', this.getSandbox(), iid);
            }
            else if (f === fsPromise.mkdtemp)
            {
                (<ReturnType<typeof fsPromise.mkdtemp>>result).then((filePath) =>
                {
                    FileLogStore.appendFileOperation(filePath, 'write', this.getSandbox(), iid);
                });
            }
            else if (f === fs.mkdtempSync)
            {
                const filePath = result as ReturnType<typeof fs.mkdtempSync>;
                FileLogStore.appendFileOperation(filePath, 'write', this.getSandbox(), iid);
            }
            else if (f === fs.open)
            {
                const filePath = args[0] as Parameters<typeof fs.open>[0];
                const callback = args[args.length - 1] as LastParameter<typeof fs.open>;
                const fileDeclaration = FileLogStore.getFileDeclarationByFilePathLike(filePath);
                this.callbackToFileDeclarationInfo.set(callback, {register: f, fileDeclaration});  // later processed in functionEnter()
            }
            // @ts-ignore
            else if (this.fdReadApis.has(f))
            {
                const fd = args[0];
                assert.ok(typeof fd === 'number');
                FileLogStore.appendFileOperation(fd, 'read', this.getSandbox(), iid);
            }
            // @ts-ignore
            else if (this.fdWriteApis.has(f))
            {
                const fd = args[0];
                assert.ok(typeof fd === 'number');
                FileLogStore.appendFileOperation(fd, 'write', this.getSandbox(), iid);
            }
        };

        this.functionEnter = (_iid, f, _dis, args) =>
        {
            const info = this.callbackToFileDeclarationInfo.get(f);
            if (info !== undefined)
            {
                const {register, fileDeclaration} = info;
                if (register === fs.open)
                {
                    assert.ok(fileDeclaration !== undefined);
                    const err = args[0];
                    const fd = args[1];
                    if (err === null)
                    {
                        assert.ok(typeof fd === 'number');
                        FileLogStore.addFd(fd, fileDeclaration);
                    }
                }
            }
        };
    }
}