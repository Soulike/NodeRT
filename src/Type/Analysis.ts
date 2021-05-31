// DO NOT INSTRUMENT
import Sandbox from './Sandbox';

abstract class Analysis
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

export default Analysis;