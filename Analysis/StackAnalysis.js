/**
 * @description Output the information of functions run.
 * */
const FunctionStackFrame = require('../Class/FunctionStackFrame');

// DO NOT INSTRUMENT
(function (sandbox)
{
    function StackAnalysis()
    {
        /**@type {number}*/
        let functionNumber = 0;
        /**@type FunctionStackFrame[]*/
        const shadowStack = [];
        /**
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {function} f - The function object whose body is about to get executed
         * @param {*} dis - The value of the <tt>this</tt> variable in the function body
         * @param {Array} args - List of the arguments with which the function is called
         * @returns {undefined} - Any return value is ignored*/
        this.functionEnter = function (iid, f, dis, args)
        {
            /**@type {SourceObject}*/
            const sourceObject = sandbox.iidToSourceObject(iid);
            const name = f.name;
            const frame = new FunctionStackFrame(name, args, sourceObject);
            shadowStack.push(frame);
            console.log(`Stack ${functionNumber}: ${JSON.stringify(frame, null, 2)}`);
        };

        /**
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {*} returnVal - The value returned by the function
         * @param {{exception:*} | undefined} wrappedExceptionVal - If this parameter is an object, the function
         * execution has thrown an uncaught exception and the exception is being stored in the <tt>exception</tt>
         * property of the parameter
         * @returns {{returnVal: *, wrappedExceptionVal: *, isBacktrack: boolean}}  If an object is returned, then the
         * actual <tt>returnVal</tt> and <tt>wrappedExceptionVal.exception</tt> are replaced with that from the
         * returned object. If an object is returned and the property <tt>isBacktrack</tt> is set, then the control-flow
         * returns to the beginning of the function body instead of returning to the caller.  The property
         * <tt>isBacktrack</tt> can be set to <tt>true</tt> to repeatedly execute the function body as in MultiSE
         * symbolic execution.
         * */
        this.functionExit = function (iid, returnVal, wrappedExceptionVal)
        {
            shadowStack.pop();
            if (shadowStack.length === 0)
            {
                functionNumber++;
            }
        };
    }

    sandbox.analysis = new StackAnalysis();
})(J$);
