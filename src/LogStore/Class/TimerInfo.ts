export class TimerInfo
{
    private static lastIndex = 0;
    public readonly callback: Function;
    public readonly delay: number;
    public readonly type: 'interval' | 'timeout';
    public readonly index: number;

    constructor(callback: Function, delay: number, type: TimerInfo['type'])
    {
        this.callback = callback;
        this.delay = delay;
        this.type = type;
        this.index = TimerInfo.lastIndex++;
    }
}