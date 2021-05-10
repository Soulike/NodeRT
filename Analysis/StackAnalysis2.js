/**
 * @description Output the information of functions run.
 * */

const FunctionStackFrame = require('../Class/FunctionStackFrame');

// DO NOT INSTRUMENT
(function (sandbox)
{
    function StackAnalysis2()
    {
        /**@type {number}*/
        let stackNumber = 0;
        /**@type FunctionStackFrame[]*/
        const shadowStack = [];

        /**
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {function} f - The function object that going to be invoked
         * @param {object} base - The receiver object for the function <tt>f</tt>
         * @param {Array} args - The array of arguments passed to <tt>f</tt>
         * @param {boolean} isConstructor - True if <tt>f</tt> is invoked as a constructor
         * @param {boolean} isMethod - True if <tt>f</tt> is invoked as a method
         * @param {number} functionIid - The iid (i.e. the unique instruction identifier) where the function was created
         * @param {number} functionSid - The sid (i.e. the unique script identifier) where the function was created
         * @returns {{f: function, base: Object, args: Array, skip: boolean}|undefined} - If an object is returned and
         * the <tt>skip</tt> property of the object is true, then the invocation operation is skipped.
         * Original <tt>f</tt>, <tt>base</tt>, and <tt>args</tt> are replaced with that from the returned object if
         * an object is returned.*/
        this.invokeFunPre = function (iid, f, base, args, isConstructor, isMethod, functionIid, functionSid)
        {
            /**@type {Position}*/
            const position = sandbox.iidToSourceObject(iid);
            const name = f.name;
            const frame = new FunctionStackFrame(name, args, position);
            shadowStack.push(frame);
            console.log(`Stack ${stackNumber}: ${JSON.stringify(frame, null, 2)}`);
        };

        /**
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {function} f - The function object that was invoked
         * @param {*} base - The receiver object for the function <tt>f</tt>
         * @param {Array} args - The array of arguments passed to <tt>f</tt>
         * @param {*} result - The value returned by the invocation
         * @param {boolean} isConstructor - True if <tt>f</tt> is invoked as a constructor
         * @param {boolean} isMethod - True if <tt>f</tt> is invoked as a method
         * @param {number} functionIid - The iid (i.e. the unique instruction identifier) where the function was created
         * @param {number} functionSid - The sid (i.e. the unique script identifier) where the function was created
         * @returns {{result: *}| undefined} - If an object is returned, the return value of the invoked function is
         * replaced with the value stored in the <tt>result</tt> property of the object.  This enables one to change the
         * value that is returned by the actual function invocation.*/
        this.invokeFun = function (iid, f, base, args, result, isConstructor, isMethod, functionIid, functionSid)
        {
            shadowStack.pop();
            if (shadowStack.length === 0)
            {
                stackNumber++;
            }
        };

        /**
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {function} f - The function object whose body is about to get executed
         * @param {*} dis - The value of the <tt>this</tt> variable in the function body
         * @param {Array} args - List of the arguments with which the function is called
         * @returns {undefined} - Any return value is ignored*/
        this.functionEnter = function (iid, f, dis, args)
        {

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

        };
    }

    sandbox.analysis = new StackAnalysis2();
})(J$);
