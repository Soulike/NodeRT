import Sandbox from './Sandbox';

export declare abstract class Analysis
{
    private readonly sandbox: Sandbox;

    protected constructor(sandbox: Sandbox)
    {
        this.sandbox = sandbox;
    }

    public getSandbox()
    {
        return this.sandbox;
    }

    protected abstract registerHooks(): void;
}