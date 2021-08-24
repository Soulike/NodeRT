// DO NOT INSTRUMENT

import {Sandbox} from '../../Type/nodeprof';
import {AsyncContextLogStore} from '../AsyncContextLogStore';
import {getSourceCodeInfoFromIid} from '../../Util';
import {FileDeclaration} from './Class/FileDeclaration';
import {FileOperation} from './Class/FileOperation';
import {URL} from 'url';
import {BufferLike} from '../../Analysis/Type/BufferLike';
import {FileHandle} from 'fs/promises';

export class FileLogStore
{
    private static readonly filePathToFileDeclaration: Map<string, FileDeclaration> = new Map();
    private static readonly fdToFilePathOrBuffer: Map<number, string | BufferLike>;
    private static readonly fileHandles: Set<FileHandle> = new Set();

    public static getFileDeclarations(): ReadonlyArray<FileDeclaration>
    {
        return Array.from(FileLogStore.filePathToFileDeclaration.values());
    }

    public static getFileHandles(): ReadonlySet<FileHandle>
    {
        return this.fileHandles;
    }

    public static addFileHandle(fileHandle: FileHandle)
    {
        this.fileHandles.add(fileHandle);
    }

    public static deleteFileHandle(fileHandle: FileHandle)
    {
        this.fileHandles.delete(fileHandle);
        this.fdToFilePathOrBuffer.delete(fileHandle.fd);
    }

    public static addFd(fd: number, filePathOrBuffer: string | URL | BufferLike)
    {
        if (typeof filePathOrBuffer === 'string')
        {
            FileLogStore.getFileDeclaration(filePathOrBuffer);
        }
        if (filePathOrBuffer instanceof URL)
        {
            FileLogStore.fdToFilePathOrBuffer.set(fd, filePathOrBuffer.href);
        }
        else
        {
            FileLogStore.fdToFilePathOrBuffer.set(fd, filePathOrBuffer);
        }
    }

    public static deleteFd(fd: number)
    {
        this.fdToFilePathOrBuffer.delete(fd);
    }

    public static appendFileOperation(filePath: string | URL, type: 'read' | 'write', sandbox: Sandbox, iid: number)
    {
        const fileDeclaration = FileLogStore.getFileDeclaration(filePath);
        if (fileDeclaration !== undefined)
        {
            fileDeclaration.appendOperation(AsyncContextLogStore.getCurrentCallbackFunction(),
                new FileOperation(type, getSourceCodeInfoFromIid(iid, sandbox)));
        }
    }

    public static getFileDeclaration(filePathLike: string | URL): FileDeclaration
    {
        const realFilePath = typeof filePathLike === 'string' ? filePathLike : filePathLike.href;
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

    public static getFilePathOrBufferFromFd(fd: number): string | BufferLike | undefined
    {
        return FileLogStore.fdToFilePathOrBuffer.get(fd);
    }
}