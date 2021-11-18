// DO NOT INSTRUMENT

import {SourceCodeInfo} from './SourceCodeInfo';
import {ResourceDeclaration} from './ResourceDeclaration';
import assert from 'assert';
import {ResourceInfo} from './ResourceInfo';
import {TimerInfo} from './TimerInfo';
import {ImmediateInfo} from './ImmediateInfo';

export class AsyncCalledFunctionInfo
{
    public static readonly UNKNOWN_ASYNC_ID = 0;
    public static readonly UNKNOWN = new AsyncCalledFunctionInfo(null, null, AsyncCalledFunctionInfo.UNKNOWN_ASYNC_ID, 'UNKNOWN', null, null, null, null);

    public static readonly GLOBAL_ASYNC_ID = 1;
    public static readonly GLOBAL = new AsyncCalledFunctionInfo(null, null, AsyncCalledFunctionInfo.GLOBAL_ASYNC_ID, 'GLOBAL', null, null, null, null);

    private static lastIndex = 0;

    public functionWeakRef: WeakRef<Function> | null;
    public stackTrace: string[] | null;
    public asyncId: number;
    public asyncType: string;
    public asyncContext: AsyncCalledFunctionInfo | null;    // null for global
    public codeInfo: SourceCodeInfo | null;
    public index: number;

    public timerInfo: TimerInfo | null;   // is TimeInfo when asyncType === Timeout
    public immediateInfo: ImmediateInfo | null;   // is ImmediateInfo when asyncType === Immediate

    /** Whether the callback function does any writing operation on certain resource*/
    private hasWriteOperationOnResourcesSet: Set<ResourceInfo>;

    /** Lazy calculation for getAsyncContextChainAsyncIds() */
    private asyncContextChainAsyncIdsCache: Set<number> | undefined;
    private nonTickObjectAsyncIdCache: number | undefined;

    constructor(func: Function | null, stackTrace: string[] | null,
        asyncId: number, asyncType: string, asyncContext: AsyncCalledFunctionInfo | null,
        codeInfo: SourceCodeInfo | null,
        timerInfo: TimerInfo | null, immediateInfo: ImmediateInfo | null)
    {
        this.functionWeakRef = func !== null ? new WeakRef(func) : null;
        this.stackTrace = stackTrace;
        this.asyncId = asyncId;
        this.asyncType = asyncType;
        this.asyncContext = asyncContext; // 被创建时所在的 scope
        this.codeInfo = codeInfo;   // 本 callback 是被什么地方的代码注册执行的
        this.index = AsyncCalledFunctionInfo.lastIndex++;
        this.timerInfo = timerInfo;
        this.immediateInfo = immediateInfo;

        this.hasWriteOperationOnResourcesSet = new Set();
    }

    public clone(): AsyncCalledFunctionInfo
    {
        const func = this.functionWeakRef === null ? null : this.functionWeakRef.deref();
        assert.ok(func !== undefined);  // func should not be gc-ed
        return new AsyncCalledFunctionInfo(
            func,
            this.stackTrace,
            this.asyncId,
            this.asyncType,
            this.asyncContext,
            this.codeInfo,
            this.timerInfo,
            this.immediateInfo,
        );
    }

    public setInfo(func: Function, stackTrace: string[], asyncId: number, asyncType: string, asyncContext: AsyncCalledFunctionInfo, codeInfo: SourceCodeInfo | null, timerInfo: TimerInfo | null, immediateInfo: ImmediateInfo | null)
    {
        this.functionWeakRef = new WeakRef(func);
        this.stackTrace = stackTrace;
        this.asyncId = asyncId;
        this.asyncType = asyncType;
        this.asyncContext = asyncContext;
        this.codeInfo = codeInfo;
        this.timerInfo = timerInfo;
        this.immediateInfo = immediateInfo;
    }

    public setHasWriteOperation(resourceInfo: ResourceInfo): void;
    public setHasWriteOperation(resourceDeclaration: ResourceDeclaration): void;
    public setHasWriteOperation(resourceDeclarationOrInfo: ResourceInfo | ResourceDeclaration)
    {
        if (resourceDeclarationOrInfo instanceof ResourceDeclaration)
        {
            this.hasWriteOperationOnResourcesSet.add(resourceDeclarationOrInfo.getResourceInfo());
        }
        else
        {
            this.hasWriteOperationOnResourcesSet.add(resourceDeclarationOrInfo);
        }
    }

    public getHasWriteOperationOn(resourceInfo: ResourceInfo): boolean;
    public getHasWriteOperationOn(resourceDeclaration: ResourceDeclaration): boolean;
    public getHasWriteOperationOn(resourceDeclarationOrInfo: ResourceInfo | ResourceDeclaration): boolean
    {
        if (resourceDeclarationOrInfo instanceof ResourceDeclaration)
        {
            return this.hasWriteOperationOnResourcesSet.has(resourceDeclarationOrInfo.getResourceInfo());
        }
        else
        {
            return this.hasWriteOperationOnResourcesSet.has(resourceDeclarationOrInfo);
        }
    }

    public toJSON()
    {
        if (this.codeInfo === null && this.asyncType === 'Immediate')
        {
            return null;
        }
        else
        {
            return {
                ...this,
                functionWeakRef: undefined,
                hasWriteOperationOnResourcesSet: undefined,
                asyncContextChainAsyncIdsCache: undefined,
                nonTickObjectAsyncIdCache: undefined,
            };
        }
    }

    /** get all asyncIds on the async context chain */
    public getAsyncContextChainAsyncIds(): Set<number>
    {
        if (this.asyncContextChainAsyncIdsCache)
        {
            return this.asyncContextChainAsyncIdsCache;
        }
        else
        {
            const asyncContextChainAsyncIdsCache = new Set<number>();
            let currentAsyncContext: AsyncCalledFunctionInfo | null = this;
            while (currentAsyncContext !== null)    // get the async id chain
            {
                // Ignore async context introduced by test framework.
                if (currentAsyncContext.asyncType === 'Immediate' && currentAsyncContext.immediateInfo === null)
                {
                    // Fake global. Prevent async context introduced by test framework form race condition with real global
                    asyncContextChainAsyncIdsCache.add(AsyncCalledFunctionInfo.GLOBAL_ASYNC_ID);
                    break;
                }
                // It's impossible to interleave otherAsyncType -> TickObject, ignore TickObject
                if (currentAsyncContext.asyncType !== 'TickObject')
                {
                    asyncContextChainAsyncIdsCache.add(currentAsyncContext.asyncId);
                }
                
                currentAsyncContext = currentAsyncContext.asyncContext;
            }
            this.asyncContextChainAsyncIdsCache = asyncContextChainAsyncIdsCache;
            return asyncContextChainAsyncIdsCache;
        }
    }

    public getNonTickObjectAsyncId()
    {
        if (this.nonTickObjectAsyncIdCache !== undefined)
        {
            return this.nonTickObjectAsyncIdCache;
        }
        else
        {
            let currentAsyncContext: AsyncCalledFunctionInfo = this;
            while (currentAsyncContext.asyncType === 'TickObject')    // get the last non TickObject async context
            {
                currentAsyncContext = currentAsyncContext.asyncContext!;
            }
            this.nonTickObjectAsyncIdCache = currentAsyncContext.asyncId;
            return currentAsyncContext.asyncId;
        }
    }
}