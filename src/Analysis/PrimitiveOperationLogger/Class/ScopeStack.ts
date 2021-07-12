// DO NOT INSTRUMENT

import {Scope} from './Scope';

export class ScopeStack
{
    private readonly stack: Scope[];

    constructor()
    {
        this.stack = [];
    }

    public push(scope: Scope): void
    {
        this.stack.push(scope);
    }

    public pop(): Scope | undefined
    {
        return this.stack.pop();
    }

    public getTop(): Scope | undefined
    {
        return this.stack[this.getSize() - 1];
    }

    public getSize(): number
    {
        return this.stack.length;
    }

    public isEmpty(): boolean
    {
        return this.getSize() === 0;
    }
}