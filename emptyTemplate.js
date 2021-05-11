/**
 * This template is created based on emptyTemplate.js from NodeProf.js and document from jalangi2
 * */

// DO NOT INSTRUMENT
(function (sandbox)
{
    function MyAnalysis()
    {
        /**
         * This callback is called before a function, method, or constructor invocation.
         *
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {function} f - The function object that going to be invoked
         * @param {object} base - The receiver object for the function <tt>f</tt>
         * @param {Array} args - The array of arguments passed to <tt>f</tt>
         * @param {boolean} isConstructor - True if <tt>f</tt> is invoked as a constructor
         * @param {boolean} isMethod - True if <tt>f</tt> is invoked as a method
         * @param {number} functionIid - The iid (i.e. the unique instruction identifier) where the function was created
         * @param {number} functionSid - The sid (i.e. the unique script identifier) where the function was created
         * {@link MyAnalysis#functionEnter} when the function <tt>f</tt> is executed.  The <tt>functionIid</tt> can be
         * treated as the static identifier of the function <tt>f</tt>.  Note that a given function code block can
         * create several function objects, but each such object has a common <tt>functionIid</tt>, which is the iid
         * that is passed to {@link MyAnalysis#functionEnter} when the function executes.
         * @returns {{f: function, base: Object, args: Array, skip: boolean}|undefined} - If an object is returned and
         * the <tt>skip</tt> property of the object is true, then the invocation operation is skipped.
         * Original <tt>f</tt>, <tt>base</tt>, and <tt>args</tt> are replaced with that from the returned object if
         * an object is returned.
         * */
        this.invokeFunPre = function (iid, f, base, args, isConstructor, isMethod, functionIid, functionSid)
        {

        };

        /**
         * This callback is called after a function, method, or constructor invocation.
         *
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {function} f - The function object that was invoked
         * @param {*} base - The receiver object for the function <tt>f</tt>
         * @param {Array} args - The array of arguments passed to <tt>f</tt>
         * @param {*} result - The value returned by the invocation
         * @param {boolean} isConstructor - True if <tt>f</tt> is invoked as a constructor
         * @param {boolean} isMethod - True if <tt>f</tt> is invoked as a method
         * @param {number} functionIid - The iid (i.e. the unique instruction identifier) where the function was created
         * @param {number} functionSid - The sid (i.e. the unique script identifier) where the function was created
         * {@link MyAnalysis#functionEnter} when the function f is executed.  <tt>functionIid</tt> can be treated as the
         * static identifier of the function <tt>f</tt>.  Note that a given function code block can create several function
         * objects, but each such object has a common <tt>functionIid</tt>, which is the iid that is passed to
         * {@link MyAnalysis#functionEnter} when the function executes.
         * @returns {{result: *}| undefined} - If an object is returned, the return value of the invoked function is
         * replaced with the value stored in the <tt>result</tt> property of the object.  This enables one to change the
         * value that is returned by the actual function invocation.
         * */
        this.invokeFun = function (iid, f, base, args, result, isConstructor, isMethod, functionIid, functionSid)
        {

        };

        /**
         * This callback is called after the creation of a literal. A literal can be a function
         * literal, an object literal, an array literal, a number, a string, a boolean, a regular
         * expression, null, NaN, Infinity, or undefined.
         *
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {*} val - The literal value
         * @param fakeHasGetterSetter is a placeholder to be consistent with Jalangi's API.
         * The value provided in the callback is always undefined while
         * the actual value should be computed lazily via J$.adapter.hasGetterSetter(code)
         * @param literalType is a new argument provided by NodeProf showing the type of literal
         * */
        this.literal = function (iid, val, /* hasGetterSetter should be computed lazily */ fakeHasGetterSetter, literalType)
        {

        };
        // optional literal type filter: by specifying the types in an array, only given types of literals will be instrumented
        this.literal.types = ['ObjectLiteral', 'ArrayLiteral', 'FunctionLiteral', 'NumericLiteral', 'BooleanLiteral', 'StringLiteral',
            'NullLiteral', 'UndefinedLiteral', 'RegExpLiteral'];

        /**
         * This callback is called before a property of an object is accessed.
         *
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {*} base - Base object
         * @param {string|*} offset - Property
         * @param {boolean} isComputed - True if property is accessed using square brackets.  For example,
         * <tt>isComputed</tt> is <tt>true</tt> if the get field operation is <tt>o[p]</tt>, and <tt>false</tt>
         * if the get field operation is <tt>o.p</tt>
         * @param {boolean} isOpAssign - True if the operation is of the form <code>o.p op= e</code>
         * @param {boolean} isMethodCall - True if the get field operation is part of a method call (e.g. <tt>o.p()</tt>)
         * @returns {{base: *, offset: *, skip: boolean} | undefined} - If an object is returned and the <tt>skip</tt>
         * property of the object is true, then the get field operation is skipped.  Original <tt>base</tt> and
         * <tt>offset</tt> are replaced with that from the returned object if an object is returned.
         * */
        this.getFieldPre = function (iid, base, offset, isComputed, isOpAssign, isMethodCall)
        {

        };

        /**
         * This callback is called after a property of an object is accessed.
         *
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {*} base - Base object
         * @param {string|*} offset - Property
         * @param {*} val - Value of <code>base[offset]</code>
         * @param {boolean} isComputed - True if property is accessed using square brackets.  For example,
         * <tt>isComputed</tt> is <tt>true</tt> if the get field operation is <tt>o[p]</tt>, and <tt>false</tt>
         * if the get field operation is <tt>o.p</tt>
         * @param {boolean} isOpAssign - True if the operation is of the form <code>o.p op= e</code>
         * @param {boolean} isMethodCall - True if the get field operation is part of a method call (e.g. <tt>o.p()</tt>)
         * @returns {{result: *} | undefined} - If an object is returned, the value of the get field operation  is
         * replaced with the value stored in the <tt>result</tt> property of the object.
         * */
        this.getField = function (iid, base, offset, val, isComputed, isOpAssign, isMethodCall)
        {

        };

        /**
         * This callback is called before a property of an object is written.
         *
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {*} base - Base object
         * @param {*} offset - Property
         * @param {*} val - Value to be stored in <code>base[offset]</code>
         * @param {boolean} isComputed - True if property is accessed using square brackets.  For example,
         * <tt>isComputed</tt> is <tt>true</tt> if the get field operation is <tt>o[p]</tt>, and <tt>false</tt>
         * if the get field operation is <tt>o.p</tt>
         * @param {boolean} isOpAssign - True if the operation is of the form <code>o.p op= e</code>
         * @returns {{base: *, offset: *, val: *, skip: boolean} | undefined} -  If an object is returned and the <tt>skip</tt>
         * property is true, then the put field operation is skipped.  Original <tt>base</tt>, <tt>offset</tt>, and
         * <tt>val</tt> are replaced with that from the returned object if an object is returned.
         * */
        this.putFieldPre = function (iid, base, offset, val, isComputed, isOpAssign)
        {

        };

        /**
         * This callback is called after a property of an object is written.
         *
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {*} base - Base object
         * @param {*} offset - Property
         * @param {*} val - Value to be stored in <code>base[offset]</code>
         * @param {boolean} isComputed - True if property is accessed using square brackets.  For example,
         * <tt>isComputed</tt> is <tt>true</tt> if the get field operation is <tt>o[p]</tt>, and <tt>false</tt>
         * if the get field operation is <tt>o.p</tt>
         * @param {boolean} isOpAssign - True if the operation is of the form <code>o.p op= e</code>
         * @returns {{result: *} | undefined} -   If an object is returned, the result of the put field operation is
         * replaced with the value stored in the <tt>result</tt> property of the object.
         * */
        this.putField = function (iid, base, offset, val, isComputed, isOpAssign)
        {

        };

        /**
         * This callback is called after a variable is read.
         *
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {string} name - Name of the variable being read
         * @param {*} val - Value read from the variable
         * @param {boolean} isGlobal - True if the variable is not declared using <tt>var</tt> (e.g. <tt>console</tt>)
         * @param {boolean} isScriptLocal - True if the variable is declared in the global scope using <tt>var</tt>
         * @returns {{result: *} | undefined} - If an object is returned, the result of the read operation is
         * replaced with the value stored in the <tt>result</tt> property of the object.
         * */
        this.read = function (iid, name, val, isGlobal, isScriptLocal)
        {

        };

        /**
         * This callback is called before a variable is written.
         *
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {string} name - Name of the variable being read
         * @param {*} val - Value to be written to the variable
         * @param {*} lhs - Value stored in the variable before the write operation
         * @param {boolean} isGlobal - True if the variable is not declared using <tt>var</tt> (e.g. <tt>console</tt>)
         * @param {boolean} isScriptLocal - True if the variable is declared in the global scope using <tt>var</tt>
         * @returns {{result: *} | undefined} - If an object is returned, the result of the write operation is
         * replaced with the value stored in the <tt>result</tt> property of the object.
         * */
        this.write = function (iid, name, val, lhs, isGlobal, isScriptLocal)
        {

        };

        /**
         * This callback is called before the execution of a function body starts.
         *
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {function} f - The function object whose body is about to get executed
         * @param {*} dis - The value of the <tt>this</tt> variable in the function body
         * @param {Array} args - List of the arguments with which the function is called
         * @returns {undefined} - Any return value is ignored
         * */
        this.functionEnter = function (iid, f, dis, args)
        {

        };

        /**
         * This callback is called when the execution of a function body completes
         *
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

        /**
         * This callback is called before the execution of a builtin function body starts and after it completes.
         *
         * @param {string} name - Builtin function name
         * @param {function} f - The function object whose body is about to get executed
         * @param {*} dis - The value of the <tt>this</tt> variable in the function body
         * @param {Array} args - List of the arguments with which the function is called
         * @returns {undefined} - Any return value is ignored
         * */
        this.builtinEnter = function (name, f, dis, args)
        {
        };

        /**
         * This callback is called before the execution of a builtin function body starts and after it completes.
         *
         * @param {string} name - Builtin function name
         * @param {*} returnVal - The value returned by the function
         * @returns {{returnVal: *}}
         * */
        this.builtinExit = function (name, returnVal)
        {

        };

        /**
         * This callback is called before a binary operation. Binary operations include  +, -, *, /, %, &, |, ^,
         * <<, >>, >>>, <, >, <=, >=, ==, !=, ===, !==, instanceof, delete, in.  No callback for <code>delete x</code>
         * because this operation cannot be performed reflectively.
         *
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {string} op - Operation to be performed
         * @param {*} left - Left operand
         * @param {*} right - Right operand
         * @returns {{op: string, left: *, right: *, skip: boolean}|undefined} - If an object is returned and the
         * <tt>skip</tt> property is true, then the binary operation is skipped.  Original <tt>op</tt>, <tt>left</tt>,
         * and <tt>right</tt> are replaced with that from the returned object if an object is returned.
         * */
        this.binaryPre = function (iid, op, left, right)
        {

        };

        /**
         * This callback is called after a binary operation. Binary operations include  +, -, *, /, %, &, |, ^,
         * <<, >>, >>>, <, >, <=, >=, ==, !=, ===, !==, instanceof, delete, in.
         *
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {string} op - Operation to be performed
         * @param {*} left - Left operand
         * @param {*} right - Right operand
         * @param {*} result - The result of the binary operation
         * @returns {{result: *}|undefined} - If an object is returned, the result of the binary operation is
         * replaced with the value stored in the <tt>result</tt> property of the object.
         * */
        this.binary = function (iid, op, left, right, result)
        {

        };

        /**
         * This callback is called before a unary operation. Unary operations include  +, -, ~, !, typeof, void.
         *
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {string} op - Operation to be performed
         * @param {*} left - Left operand
         * @returns {{op: *, left: *, skip: boolean} | undefined} If an object is returned and the
         * <tt>skip</tt> property is true, then the unary operation is skipped.  Original <tt>op</tt> and <tt>left</tt>
         * are replaced with that from the returned object if an object is returned.
         * */
        this.unaryPre = function (iid, op, left)
        {

        };

        /**
         * This callback is called after a unary operation. Unary operations include  +, -, ~, !, typeof, void.
         *
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {string} op - Operation to be performed
         * @param {*} left - Left operand
         * @param {*} result - The result of the unary operation
         * @returns {{result: *}|undefined} - If an object is returned, the result of the unary operation is
         * replaced with the value stored in the <tt>result</tt> property of the object.
         * */
        this.unary = function (iid, op, left, result)
        {

        };

        /**
         * This callback is called after a condition check before branching. Branching can happen in various statements
         * including if-then-else, switch-case, while, for, ||, &&, ?:.
         *
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {*} result - The value of the conditional expression
         * @returns {{result: *}|undefined} - If an object is returned, the result of the conditional expression is
         * replaced with the value stored in the <tt>result</tt> property of the object.
         * */
        this.conditional = function (iid, result)
        {

        };

        /**
         * This callback is called before an expression
         * @param iid {number} source code location id
         * @param type {string} type of the expression, TODO: use some standard type names, e.g., ESTree
         **/
        this.startExpression = function (iid, type)
        {

        };

        /**
         * This callback is called after an expression
         * @param iid {number} source code location id
         * @param type {string} type of the expression, TODO: use some standard type names, e.g., ESTree
         * @param result {any} the execution result of the expression
         **/
        this.endExpression = function (iid, type, result)
        {
        };

        /**
         * This callback is called when an execution terminates in node.js.  In a browser environment, the callback is
         * called if ChainedAnalyses.js or ChainedAnalysesNoCheck.js is used and Alt-Shift-T is pressed.
         *
         * @returns {undefined} - Any return value is ignored
         */
        this.endExecution = function ()
        {
        };

        //for callbacks that are new or different from Jalangi
        var extraFeatures = true;
        if (extraFeatures)
        {
            /**
             * This callback is called before code is executed by eval.
             *
             * @param iid {number} source code location id
             * @param str {string} code will be evaluated by eval
             **/
            this.evalPre = function (iid, str)
            {
            };

            /**
             * This callback is called after code is executed by eval.
             * @param iid {number} source code location id
             * @param str {string} code evaluated by eval
             * @param ret {*} return result of the eval
             **/
            this.evalPost = function (iid, str, ret)
            {
            };

            /**
             *  This callback is called before body of functions defined with the Function constructor are executed.
             *
             * @param {number} iid Static unique instruction identifier of this callback
             * @param {function} func The function object that was invoked
             * @param {object} receiver The receiver object for the function <tt>f</tt>
             * @param {Array} args The array of arguments passed to <tt>f</tt>
             * */
            this.evalFunctionPre = function (iid, func, receiver, args)
            {

            };

            /**
             *  This callback is called after body of functions defined with the Function constructor are executed.
             *
             * @param {number} iid Static unique instruction identifier of this callback
             * @param {function} func The function object that was invoked
             * @param {object} receiver The receiver object for the function <tt>f</tt>
             * @param {Array} args The array of arguments passed to <tt>f</tt>
             * @param {*} ret The value returned by the invocation
             * */
            this.evalFunctionPost = function (iid, func, receiver, args, ret)
            {
            };

            /**
             * This callback is called when new source code is encountered during instrumentation.
             *
             * @ param {object} source - object describing the source. contains {string} name and {boolean} internal properties.
             * @ param {string} code - the source code text.
             **/
            this.newSource = function (source, code)
            {
            };

            /**
             *  Declaration of a symbol, type can be `'const', 'let', 'var'`, kind is `'FunctionDeclaration'` or `undefined`.
             *  Jalangi version: this.declare = function (iid, name, val, isArgument, argumentIndex, isCatchParam) {
             **/
            this.declarePre = function (iid, name, type, kind)
            {
            };
            this.declare = function (iid, name, type, kind)
            {
            };

            /**
             * Callbacks triggered before and after an expression.
             * Note that callback behavior may depend on Graal.js internals and NodeProf cannot guarantee that type values will
             * remain stable over time.
             *
             * @param iid {number} source code location id
             * @param type {string} Graal.js internal AST type of the expression
             **/
            this.startExpression = function (iid, type)
            {
            };

            /**
             * @param iid {number} source code location id
             * @param type {string} Graal.js internal AST type of the expression
             * */
            this.endExpression = function (iid, type)
            {
            };

            /**
             * Callbacks triggered before and after a statement.
             * Note that callback behavior may depend on Graal.js internals and NodeProf cannot guarantee that type values will
             * remain stable over time.
             *
             * @param iid {number} source code location id
             * @param type {string} Graal.js internal AST type of the statement
             **/
            this.startStatement = function (iid, type)
            {
            };

            /**
             * @param iid {number} source code location id
             * @param type {string} Graal.js internal AST type of the statement
             * */
            this.endStatement = function (iid, type)
            {
            };

            /**
             *  forin or forof support
             *  the object being iterated can be known by checking the last expression's result (via endExpression)
             *
             * @param {number} iid
             * @param {boolean} isForIn
             * */
            this.forObject = function (iid, isForIn)
            {
            };

            /**
             * This callback is called before a value is returned from a function using the <tt>return</tt> keyword.
             *
             * This does NOT mean the function is being exited. Functions can return 0, 1, or more times.
             * For example:
             * - <tt>void</tt> functions return 0 times
             * - functions that use the <tt>return</tt> keyword regularly return 1 time
             * - functions that return in both parts of a try/finally block can return 2 times
             *
             * To see when a function ACTUALLY exits, see the <tt>functionExit</tt> callback.
             *
             * @param {number} iid - Static unique instruction identifier of this callback
             * @param {*} val - Value to be returned
             */
            this._return = function (iid, val)
            {
            };

            /**
             * @param {number} iid
             * */
            this.asyncFunctionEnter = function (iid)
            {
            };

            /**
             * @param {number} iid - Static unique instruction identifier of this callback
             * @param {*} result - The value returned by the function
             * @param {{exception:*} | undefined} exceptionVal - If this parameter is an object, the function
             * execution has thrown an uncaught exception and the exception is being stored in the <tt>exception</tt>
             * property of the parameter
             * */
            this.asyncFunctionExit = function (iid, result, exceptionVal)
            {
            };

            /**
             * @param {number} iid
             * @param {Promise | any} promiseOrValAwaited
             * */
            this.awaitPre = function (iid, promiseOrValAwaited)
            {
            };

            /**
             * @param {number} iid
             * @param {Promise | any} promiseOrValAwaited
             * @param {any} valResolveOrRejected
             * @param {boolean} isPromiseRejected
             * */
            this.awaitPost = function (iid, promiseOrValAwaited, valResolveOrRejected, isPromiseRejected)
            {
            };

        }
    }

    sandbox.analysis = new MyAnalysis();
})(J$);
