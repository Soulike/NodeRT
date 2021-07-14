// DO NOT INSTRUMENT

import {Sandbox} from '../../Type/nodeprof';
import {AsyncContextLogStore} from '../AsyncContextLogStore';
import {getSourceCodeInfoFromIid, isBufferLike} from '../../Util';
import {FileDeclaration} from './Class/FileDeclaration';
import {FileOperation} from './Class/FileOperation';
import {PathLike} from 'fs';
import {FileHandle} from 'fs/promises';
import {URL} from 'url';
import {strict as assert} from 'assert';
import {BufferLike} from '../../Analysis/Type/BufferLike';

export class FileLogStore
{
    private static readonly filePathToFileDeclaration: Map<string | BufferLike, FileDeclaration> = new Map();
    private static readonly fileHandleToFileDeclaration: Map<FileHandle, FileDeclaration>;
    private static readonly fdToFileDeclaration: Map<number, FileDeclaration>;

    public static getFileDeclarations(): ReadonlyArray<FileDeclaration>
    {
        return Array.from(FileLogStore.filePathToFileDeclaration.values());
    }

    public static getFileHandles(): ReadonlySet<FileHandle>
    {
        return new Set(FileLogStore.fileHandleToFileDeclaration.keys());
    }

    public static addFileHandle(fileHandle: FileHandle, fileDeclaration: FileDeclaration)
    {
        FileLogStore.fileHandleToFileDeclaration.set(fileHandle, fileDeclaration);
    }

    public static addFd(fd: number, fileDeclaration: FileDeclaration)
    {
        FileLogStore.fdToFileDeclaration.set(fd, fileDeclaration);
    }

    public static appendFileOperation(filePathLike: PathLike | BufferLike | FileHandle | number, type: 'read' | 'write', sandbox: Sandbox, iid: number)
    {
        const fileDeclaration = FileLogStore.getFileDeclarationByFilePathLike(filePathLike);
        if (fileDeclaration !== undefined)
        {
            fileDeclaration.appendOperation(AsyncContextLogStore.getCurrentCallbackFunction(),
                new FileOperation(type, getSourceCodeInfoFromIid(iid, sandbox)));
        }
    }

    public static getFileDeclarationByFilePathLike(filePathLike: PathLike | BufferLike | FileHandle): FileDeclaration;
    public static getFileDeclarationByFilePathLike(fd: number): FileDeclaration | undefined;
    public static getFileDeclarationByFilePathLike(filePathLike: PathLike | BufferLike | FileHandle | number): FileDeclaration | undefined;
    public static getFileDeclarationByFilePathLike(filePathLike: PathLike | BufferLike | FileHandle | number): FileDeclaration | undefined
    {
        if (isBufferLike(filePathLike) || typeof filePathLike === 'string')
        {
            const fileDeclaration = FileLogStore.filePathToFileDeclaration.get(filePathLike);
            if (fileDeclaration === undefined)
            {
                const newFileDeclaration = new FileDeclaration(filePathLike);
                FileLogStore.filePathToFileDeclaration.set(filePathLike, newFileDeclaration);
                return newFileDeclaration;
            }
            else
            {
                return fileDeclaration;
            }
        }
        else if (filePathLike instanceof URL)
        {
            const realFilePath = filePathLike.href;
            const fileDeclaration = FileLogStore.filePathToFileDeclaration.get(realFilePath);
            if (fileDeclaration === undefined)
            {
                const newFileDeclaration = new FileDeclaration(realFilePath);
                FileLogStore.filePathToFileDeclaration.set(realFilePath, newFileDeclaration);
                return newFileDeclaration;
            }
            else
            {
                return fileDeclaration;
            }
        }
        else if (typeof filePathLike === 'number')   // fd
        {
            return FileLogStore.getFileDeclarationByFd(filePathLike);   // possibly undefined
        }
        else    // FileHandle
        {
            const fileDeclaration = FileLogStore.getFileDeclarationByFileHandle(filePathLike);
            assert.ok(fileDeclaration !== undefined);
            return fileDeclaration;
        }
    }

    private static getFileDeclarationByFileHandle(fileHandle: FileHandle): FileDeclaration | undefined
    {
        return FileLogStore.fileHandleToFileDeclaration.get(fileHandle);
    }

    private static getFileDeclarationByFd(fd: number): FileDeclaration | undefined
    {
        return FileLogStore.fdToFileDeclaration.get(fd);
    }
}