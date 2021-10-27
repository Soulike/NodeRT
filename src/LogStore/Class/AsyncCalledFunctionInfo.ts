// DO NOT INSTRUMENT

import {SourceCodeInfo} from './SourceCodeInfo';
import {ResourceDeclaration} from './ResourceDeclaration';

export class AsyncCalledFunctionInfo
{
    public static readonly UNKNOWN_ASYNC_ID = 0;
    public static readonly UNKNOWN = new AsyncCalledFunctionInfo(null, null, AsyncCalledFunctionInfo.UNKNOWN_ASYNC_ID, 'UNKNOWN', null, null);

    public static readonly GLOBAL_ASYNC_ID = 1;
    public static readonly GLOBAL = new AsyncCalledFunctionInfo(null, null, AsyncCalledFunctionInfo.GLOBAL_ASYNC_ID, 'GLOBAL', null, null);

    public functionWeakRef: WeakRef<Function> | null;
    public stackTrace: string[] | null;
    public asyncId: number;
    public asyncType: string;
    public asyncContext: AsyncCalledFunctionInfo | null;    // null for global
    public codeInfo: SourceCodeInfo | null;

    /** Whether the callback function does any writing operation on certain resource*/
    private hasWriteOperationOnResourcesSet: Set<ResourceDeclaration>;

    /** Lazy calculation for getAsyncContextChainAsyncIds() */
    private asyncContextChainAsyncIdsCache: Set<number> | undefined;

    constructor(func: Function | null, stackTrace: string[] | null, asyncId: number, asyncType: string, asyncContext: AsyncCalledFunctionInfo | null, codeInfo: SourceCodeInfo | null)
    {
        this.functionWeakRef = func !== null ? new WeakRef(func) : null;
        this.stackTrace = stackTrace;
        this.asyncId = asyncId;
        this.asyncType = asyncType;
        this.asyncContext = asyncContext; // 被创建时所在的 scope
        this.codeInfo = codeInfo;   // 本 callback 是被什么地方的代码注册执行的

        this.hasWriteOperationOnResourcesSet = new Set();
    }

    public setInfo(func: Function, stackTrace: string[] | null, asyncId: number, asyncType: string, asyncContext: AsyncCalledFunctionInfo, codeInfo: SourceCodeInfo)
    {
        this.functionWeakRef = new WeakRef(func);
        this.stackTrace = stackTrace;
        this.asyncId = asyncId;
        this.asyncType = asyncType;
        this.asyncContext = asyncContext;
        this.codeInfo = codeInfo;
    }

    public setHasWriteOperation(resourceDeclaration: ResourceDeclaration)
    {
        this.hasWriteOperationOnResourcesSet.add(resourceDeclaration);
    }

    public getHasWriteOperationOn(resourceDeclaration: ResourceDeclaration): boolean
    {
        return this.hasWriteOperationOnResourcesSet.has(resourceDeclaration);
    }

    public toJSON(): Partial<this>
    {
        return {
            ...this,
            functionWeakRef: undefined,
            hasWriteOperationOnResourcesSet: undefined,
            asyncContextChainAsyncIdsCache: undefined,
        };
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
            let hasTickObject = false;
            while (currentAsyncContext !== null)    // get the async id chain
            {
                asyncContextChainAsyncIdsCache.add(currentAsyncContext.asyncId);
                if (currentAsyncContext.asyncType === 'TickObject') // Cut the chain at TickObject
                {
                    hasTickObject = true;
                    break;
                }
                currentAsyncContext = currentAsyncContext.asyncContext;
            }
            if (hasTickObject)  // Treat chain after TickObject as originated from global
            {
                asyncContextChainAsyncIdsCache.add(AsyncCalledFunctionInfo.GLOBAL_ASYNC_ID);
            }
            this.asyncContextChainAsyncIdsCache = asyncContextChainAsyncIdsCache;
            return asyncContextChainAsyncIdsCache;
        }
    }
}