import {AsyncCalledFunctionInfo} from './Class/AsyncCalledFunctionInfo';
import {ImmediateInfo} from './Class/ImmediateInfo';

export class ImmediateLogStore
{
    /**
     * When a immediate task is registered, log its async context and some info
     */
    private static asyncContextToImmediateInfos = new Map<AsyncCalledFunctionInfo, ImmediateInfo[]>();

    public static addImmediateInfo(asyncContext: AsyncCalledFunctionInfo, immediateInfo: ImmediateInfo)
    {
        while (asyncContext.asyncType === 'TickObject')
        {
            asyncContext = asyncContext.asyncContext!;
        }
        const immediateInfos = ImmediateLogStore.asyncContextToImmediateInfos.get(asyncContext);
        if (immediateInfos !== undefined)
        {
            immediateInfos.push(immediateInfo);
        }
        else
        {
            ImmediateLogStore.asyncContextToImmediateInfos.set(asyncContext, [immediateInfo]);
        }
    }

    public static getImmediateInfo(asyncContext: AsyncCalledFunctionInfo, callback: Function): ImmediateInfo | null
    {
        while (asyncContext.asyncType === 'TickObject')
        {
            asyncContext = asyncContext.asyncContext!;
        }
        const immediateInfos = ImmediateLogStore.asyncContextToImmediateInfos.get(asyncContext);
        if (immediateInfos === undefined)
        {
            return null;
        }
        for (const immediateInfo of immediateInfos)
        {
            if (immediateInfo.callback === callback)
            {
                return immediateInfo;
            }
        }
        return null;
    }

    public static deleteImmediateInfo(asyncContext: AsyncCalledFunctionInfo, callback: Function)
    {
        while (asyncContext.asyncType === 'TickObject')
        {
            asyncContext = asyncContext.asyncContext!;
        }
        const immediateInfos = ImmediateLogStore.asyncContextToImmediateInfos.get(asyncContext);
        if (immediateInfos === undefined)
        {
            return;
        }
        const index = immediateInfos.findIndex(immediateInfo => immediateInfo.callback === callback);
        immediateInfos.splice(index, 1);
    }
}