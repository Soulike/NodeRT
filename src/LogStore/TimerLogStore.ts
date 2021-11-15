import {TimerInfo} from './Class/TimerInfo';
import {AsyncCalledFunctionInfo} from './Class/AsyncCalledFunctionInfo';

export class TimerLogStore
{
    /**
     * When a timer is registered, log its async context and some info
     */
    private static asyncContextToTimerInfos = new Map<AsyncCalledFunctionInfo, TimerInfo[]>();

    public static addTimerInfo(asyncContext: AsyncCalledFunctionInfo, timerInfo: TimerInfo)
    {
        const timerInfos = TimerLogStore.asyncContextToTimerInfos.get(asyncContext);
        if (timerInfos !== undefined)
        {
            timerInfos.push(timerInfo);
        }
        else
        {
            TimerLogStore.asyncContextToTimerInfos.set(asyncContext, [timerInfo]);
        }
    }

    public static getTimerInfo(asyncContext: AsyncCalledFunctionInfo, callback: Function): TimerInfo | null
    {
        const timerInfos = TimerLogStore.asyncContextToTimerInfos.get(asyncContext);
        if (timerInfos === undefined)
        {
            return null;
        }
        for (const timerInfo of timerInfos)
        {
            if (timerInfo.callback === callback)
            {
                return timerInfo;
            }
        }
        return null;
    }

    public static deleteTimerInfo(asyncContext: AsyncCalledFunctionInfo, callback: Function)
    {
        const timerInfos = TimerLogStore.asyncContextToTimerInfos.get(asyncContext);
        if (timerInfos === undefined)
        {
            return;
        }
        const index = timerInfos.findIndex(timerInfo => timerInfo.callback === callback);
        timerInfos.splice(index, 1);
    }
}