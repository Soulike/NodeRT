export class IteratorLogStore
{
    private static readonly iteratorToIteratee: WeakMap<Iterator<any>, object> = new WeakMap();

    public static addIterator(iterator: Iterator<any>, iteratee: object): void
    {
        IteratorLogStore.iteratorToIteratee.set(iterator, iteratee);
    }

    public static hasIterator(iterator: Iterator<any>): boolean
    {
        return IteratorLogStore.iteratorToIteratee.has(iterator);
    }

    public static getIteratee(iterator: Iterator<any>): object | undefined
    {
        return IteratorLogStore.iteratorToIteratee.get(iterator);
    }
}