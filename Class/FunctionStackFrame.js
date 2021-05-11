class FunctionStackFrame
{
    /**
     * @constructor
     *
     * @param {string} functionName
     * @param {any[]} functionParameters
     * @param {SourceObject| null} functionSourceObject
     * */
    constructor(functionName, functionParameters, functionSourceObject)
    {
        this.functionName = functionName;
        this.functionParameters = functionParameters;
        this.functionSourceObject = functionSourceObject;
    }
}

module.exports = FunctionStackFrame;