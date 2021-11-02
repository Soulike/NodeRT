// DO NOT INSTRUMENT

import {Sandbox} from '../../Type/nodeprof';
import {AsyncContextLogStore} from '../AsyncContextLogStore';
import {getSourceCodeInfoFromIid} from '../../Util';
import {FileDeclaration} from './Class/FileDeclaration';
import {FileOperation} from './Class/FileOperation';
import {URL} from 'url';
import {BufferLike} from '../../Analysis/Type/BufferLike';
import {FileHandle} from 'fs/promises';
import asyncHooks from 'async_hooks';
import {CallStackLogStore} from '../CallStackLogStore';
import {SourceCodeInfo} from '../Class/SourceCodeInfo';

export class FileLogStore
{
    private static readonly filePathToFileDeclaration: Map<string, FileDeclaration> = new Map();
    private static readonly fdToFilePathOrBuffer: Map<number, string | BufferLike> = new Map();
    private static readonly fileHandles: Set<FileHandle> = new Set();

    public static getFileDeclarations(): ReadonlyArray<FileDeclaration>
    {
        return Array.from(FileLogStore.filePathToFileDeclaration.values());
    }

    public static hasFileHandle(fileHandle: FileHandle): boolean
    {
        return this.fileHandles.has(fileHandle);
    }

    public static addFileHandle(fileHandle: FileHandle, filePathOrBuffer: string | URL | BufferLike, sourceCodeInfo: SourceCodeInfo)
    {
        this.fileHandles.add(fileHandle);
        this.addFd(fileHandle.fd, filePathOrBuffer, sourceCodeInfo);
    }

    public static deleteFileHandle(fileHandle: FileHandle)
    {
        this.fileHandles.delete(fileHandle);
        this.fdToFilePathOrBuffer.delete(fileHandle.fd);
    }

    public static addFd(fd: number, filePathOrBuffer: string | URL | BufferLike, sourceCodeInfo: SourceCodeInfo)
    {
        if (typeof filePathOrBuffer === 'string')
        {
            FileLogStore.getFileDeclaration(filePathOrBuffer, sourceCodeInfo);
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
        const fileDeclaration = FileLogStore.getFileDeclaration(filePath, getSourceCodeInfoFromIid(iid, sandbox));
        const asyncContext = AsyncContextLogStore.getAsyncContextFromAsyncId(asyncHooks.executionAsyncId());
        if (type === 'write')
        {
            asyncContext.setHasWriteOperation(fileDeclaration);
        }
        if (fileDeclaration !== undefined)
        {
            fileDeclaration.appendOperation(asyncContext,
                new FileOperation(type, CallStackLogStore.getCallStack(), getSourceCodeInfoFromIid(iid, sandbox)));
        }
    }

    public static getFileDeclaration(filePathLike: string | URL, sourceCodeInfo: SourceCodeInfo): FileDeclaration
    {
        const realFilePath = typeof filePathLike === 'string' ? filePathLike : filePathLike.href;
        const fileDeclaration = FileLogStore.filePathToFileDeclaration.get(realFilePath);
        if (fileDeclaration === undefined)
        {
            const newFileDeclaration = new FileDeclaration(realFilePath, sourceCodeInfo);
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