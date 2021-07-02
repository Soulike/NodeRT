// DO NOT INSTRUMENT

/**
 * Global shared static class that logs information from `endExpression` hook.
 * Should only be written by <code>AsyncContextLogger</code>
 * */
class LastExpressionValueContainer
{
    private static lastExpressionValue: unknown;

    public static getLastExpressionValue()
    {
        return this.lastExpressionValue;
    }

    public static setLastExpressionValue(lastExpressionValue: unknown)
    {
        this.lastExpressionValue = lastExpressionValue;
    }
}

export default LastExpressionValueContainer;