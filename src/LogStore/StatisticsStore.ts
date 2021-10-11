export class StatisticsStore
{
    private static eventCount = 0;
    
    private static bufferCount = 0;
    private static fileCount = 0;
    private static objectCount = 0;
    private static primitiveCount = 0;
    private static socketCount = 0;
    private static streamCount = 0;

    private static bufferOperationCount = 0;
    private static fileOperationCount = 0;
    private static objectOperationCount = 0;
    private static primitiveOperationCount = 0;
    private static socketOperationCount = 0;
    private static streamOperationCount = 0;

    public static getEventCount()
    {
        return StatisticsStore.eventCount;
    }

    public static getTotalResourceCount()
    {
        return StatisticsStore.bufferCount
            + StatisticsStore.fileCount
            + StatisticsStore.objectCount
            + StatisticsStore.primitiveCount
            + StatisticsStore.socketCount
            + StatisticsStore.streamCount;
    }

    public static getTotalResourceOperationCount()
    {
        return StatisticsStore.bufferOperationCount
            + StatisticsStore.fileOperationCount
            + StatisticsStore.objectOperationCount
            + StatisticsStore.primitiveOperationCount
            + StatisticsStore.socketOperationCount
            + StatisticsStore.streamOperationCount;
    }

    public static addEventCount()
    {
        StatisticsStore.eventCount++;
    }

    public static addBufferCount()
    {
        StatisticsStore.bufferCount++;
    }

    public static addFileCount()
    {
        StatisticsStore.fileCount++;
    }

    public static addObjectCount()
    {
        StatisticsStore.objectCount++;
    }

    public static addPrimitiveCount()
    {
        StatisticsStore.primitiveCount++;
    }

    public static addSocketCount()
    {
        StatisticsStore.socketCount++;
    }

    public static addStreamCount()
    {
        StatisticsStore.streamCount++;
    }

    public static addBufferOperationCount()
    {
        StatisticsStore.bufferOperationCount++;
    }

    public static addFileOperationCount()
    {
        StatisticsStore.fileOperationCount++;
    }

    public static addObjectOperationCount()
    {
        StatisticsStore.objectOperationCount++;
    }

    public static addPrimitiveOperationCount()
    {
        StatisticsStore.primitiveOperationCount++;
    }

    public static addSocketOperationCount()
    {
        StatisticsStore.socketOperationCount++;
    }

    public static addStreamOperationCount()
    {
        StatisticsStore.streamOperationCount++;
    }
}