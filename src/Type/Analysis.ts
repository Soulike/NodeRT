// DO NOT INSTRUMENT
import Sandbox from './Sandbox';

class Analysis
{
    private readonly sandbox: Sandbox;

    constructor(sandbox: Sandbox)
    {
        this.sandbox = sandbox;
    }

    public getSandbox()
    {
        return this.sandbox;
    }
}

export default Analysis;