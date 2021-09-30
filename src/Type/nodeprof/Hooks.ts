// DO NOT INSTRUMENT

import {DeclareType} from './DeclareType';
import {LiteralType} from './LiteralType';

export interface Hooks
{
    /**
     * Declaration of a symbol
     * */
    declare: (iid: number, name: string, type: DeclareType, kind: 'FunctionDeclaration' | undefined) => void;

    /**
     * This callback is called after a variable is read.
     *
     * @param iid - Static unique instruction identifier of this callback
     * @param name - Name of the variable being read
     * @param val - Value read from the variable
     * @param isGlobal - True if the variable is not declared using <tt>var</tt> (e.g. <tt>console</tt>)
     * @param isScriptLocal - True if the variable is declared in the global scope using <tt>var</tt>
     * @returns {{result: *} | undefined} - If an object is returned, the result of the read operation is
     * replaced with the value stored in the <tt>result</tt> property of the object.
     * */
    read: (iid: number, name: string, val: unknown, isGlobal: boolean, isScriptLocal: boolean) => { result: unknown } | void;

    /**
     * This callback is called before a variable is written.
     *
     * @param iid - Static unique instruction identifier of this callback
     * @param name - Name of the variable being read
     * @param val - Value to be written to the variable
     * @param lhs - Value stored in the variable before the write operation
     * @param isGlobal - True if the variable is not declared using <tt>var</tt> (e.g. <tt>console</tt>)
     * @param isScriptLocal - True if the variable is declared in the global scope using <tt>var</tt>
     * @returns {{result: *} | undefined} - If an object is returned, the result of the write operation is
     * replaced with the value stored in the <tt>result</tt> property of the object.
     * */
    write: (iid: number, name: string, val: unknown, lhs: unknown, isGlobal: boolean, isScriptLocal: boolean) => { result: unknown } | void;

    /**
     * This callback is called after a property of an object is accessed.
     *
     * @param iid - Static unique instruction identifier of this callback
     * @param base - Base object
     * @param offset - Property
     * @param val - Value of <code>base[offset]</code>
     * @param isComputed - True if property is accessed using square brackets.  For example,
     * <tt>isComputed</tt> is <tt>true</tt> if the get field operation is <tt>o[p]</tt>, and <tt>false</tt>
     * if the get field operation is <tt>o.p</tt>
     * @param isOpAssign - True if the operation is of the form <code>o.p op= e</code>
     * @param isMethodCall - True if the get field operation is part of a method call (e.g. <tt>o.p()</tt>)
     * @returns {{result: *} | undefined} - If an object is returned, the value of the get field operation  is
     * replaced with the value stored in the <tt>result</tt> property of the object.
     * */
    getField: (iid: number, base: unknown, offset: string | symbol, val: unknown, isComputed: boolean, isOpAssign: boolean, isMethodCall: boolean) => { result: unknown } | void;

    /**
     * This callback is called before a property of an object is written.
     *
     * @param iid - Static unique instruction identifier of this callback
     * @param base - Base object
     * @param offset - Property
     * @param val - Value to be stored in <code>base[offset]</code>
     * @param isComputed - True if property is accessed using square brackets.  For example,
     * <tt>isComputed</tt> is <tt>true</tt> if the get field operation is <tt>o[p]</tt>, and <tt>false</tt>
     * if the get field operation is <tt>o.p</tt>
     * @param isOpAssign - True if the operation is of the form <code>o.p op= e</code>
     * @returns {{base: *, offset: *, val: *, skip: boolean} | undefined} -  If an object is returned and the <tt>skip</tt>
     * property is true, then the put field operation is skipped.  Original <tt>base</tt>, <tt>offset</tt>, and
     * <tt>val</tt> are replaced with that from the returned object if an object is returned.
     * */
    putFieldPre: (iid: number, base: unknown, offset: string | symbol, val: unknown, isComputed: boolean, isOpAssign: boolean) => { base: unknown, offset: unknown, val: unknown, skip: boolean } | void;

    /**
     * This callback is called before the execution of a function body starts.
     *
     * @param iid - Static unique instruction identifier of this callback
     * @param f - The function object whose body is about to get executed
     * @param dis - The value of the <tt>this</tt> variable in the function body
     * @param args - List of the arguments with which the function is called
     * @returns {undefined} - Any return value is ignored
     * */
    functionEnter: (iid: number, f: Function, dis: unknown, args: unknown[]) => void;

    /**
     * This callback is called when the execution of a function body completes
     *
     * @param iid - Static unique instruction identifier of this callback
     * @param returnVal - The value returned by the function
     * @param wrappedExceptionVal - If this parameter is an object, the function
     * execution has thrown an uncaught exception and the exception is being stored in the <tt>exception</tt>
     * property of the parameter
     * @returns {{returnVal: *, wrappedExceptionVal: *, isBacktrack: boolean}}  If an object is returned, then the
     * actual <tt>returnVal</tt> and <tt>wrappedExceptionVal.exception</tt> are replaced with that from the
     * returned object. If an object is returned and the property <tt>isBacktrack</tt> is set, then the control-flow
     * returns to the beginning of the function body instead of returning to the caller.  The property
     * <tt>isBacktrack</tt> can be set to <tt>true</tt> to repeatedly execute the function body as in MultiSE
     * symbolic execution.
     * */
    functionExit: (iid: number, returnVal: unknown, wrappedExceptionVal: unknown | undefined) => { returnVal: unknown, wrappedExceptionVal: unknown, isBacktrack: boolean } | void;

    /**
     * This callback is called before a function, method, or constructor invocation.
     *
     * @param iid - Static unique instruction identifier of this callback
     * @param f - The function object that going to be invoked
     * @param base - The receiver object for the function <tt>f</tt>
     * @param args - The array of arguments passed to <tt>f</tt>
     * @param isConstructor - True if <tt>f</tt> is invoked as a constructor
     * @param isMethod - True if <tt>f</tt> is invoked as a method
     * @param functionIid - The iid (i.e. the unique instruction identifier) where the function was created
     * @param functionSid - The sid (i.e. the unique script identifier) where the function was created
     * {@link Hooks#functionEnter} when the function <tt>f</tt> is executed.  The <tt>functionIid</tt> can be
     * treated as the static identifier of the function <tt>f</tt>.  Note that a given function code block can
     * create several function objects, but each such object has a common <tt>functionIid</tt>, which is the iid
     * that is passed to {@link Hooks#functionEnter} when the function executes.
     * @returns {{f: function, base: Object, args: Array, skip: boolean}|undefined} - If an object is returned and
     * the <tt>skip</tt> property of the object is true, then the invocation operation is skipped.
     * Original <tt>f</tt>, <tt>base</tt>, and <tt>args</tt> are replaced with that from the returned object if
     * an object is returned.
     * */
    invokeFunPre: (iid: number, f: Function, base: object, args: unknown[], isConstructor: boolean, isMethod: boolean, functionIid: number, functionSid: string) => { f: Function, base: object, args: unknown[], skip: boolean } | void;

    /**
     * This callback is called after a function, method, or constructor invocation.
     *
     * @param iid - Static unique instruction identifier of this callback
     * @param f - The function object that was invoked
     * @param base - The receiver object for the function <tt>f</tt>
     * @param args - The array of arguments passed to <tt>f</tt>
     * @param result - The value returned by the invocation
     * @param isConstructor - True if <tt>f</tt> is invoked as a constructor
     * @param isMethod - True if <tt>f</tt> is invoked as a method
     * @param functionIid - The iid (i.e. the unique instruction identifier) where the function was created
     * @param functionSid - The sid (i.e. the unique script identifier) where the function was created
     * {@link Hooks#functionEnter} when the function f is executed.  <tt>functionIid</tt> can be treated as the
     * static identifier of the function <tt>f</tt>.  Note that a given function code block can create several function
     * objects, but each such object has a common <tt>functionIid</tt>, which is the iid that is passed to
     * {@link Hooks#functionEnter} when the function executes.
     * @returns {{result: *}| undefined} - If an object is returned, the return value of the invoked function is
     * replaced with the value stored in the <tt>result</tt> property of the object.  This enables one to change the
     * value that is returned by the actual function invocation.
     * */
    invokeFun: (iid: number, f: Function, base: unknown, args: unknown[], result: unknown, isConstructor: boolean, isMethod: boolean, functionIid: number, functionSid: string) => { result: unknown } | void;

    /**
     *  `forin` or `forof` support
     *  the object being iterated can be known by checking the last expression's result (via `endExpression`)
     * */
    forObject: (iid: number, isForIn: boolean) => void;

    /**
     * This callback is called before an expression
     * @param iid source code location id
     * @param type type of the expression, TODO: use some standard type names, e.g., ESTree
     **/
    startExpression: (iid: number, type: string) => void;

    /**
     * @param iid source code location id
     * @param type Graal.js internal AST type of the expression
     * @param value value of the expression
     * */
    endExpression: (iid: number, type: string, value: unknown) => void;

    /**
     * This callback is called after the creation of a literal. A literal can be a function
     * literal, an object literal, an array literal, a number, a string, a boolean, a regular
     * expression, `null`, `NaN`, `Infinity`, or `undefined`.
     *
     * @param iid - Static unique instruction identifier of this callback
     * @param val - The literal value
     * @param fakeHasGetterSetter is a placeholder to be consistent with Jalangi's API.
     * The value provided in the callback is always undefined while
     * the actual value should be computed lazily via `J$.adapter.hasGetterSetter(code)`
     * @param literalType is a new argument provided by NodeProf showing the type of literal
     * */
    literal: (iid: number, val: unknown, /* hasGetterSetter should be computed lazily */ fakeHasGetterSetter: undefined, literalType: LiteralType) => void;

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
    unary: (iid: number, op: string, left: unknown, result: unknown) => { result: unknown } | void;

    /**
     * @param iid - Static unique instruction identifier of this callback
     * @param result - The value returned by the function
     * @param exceptionVal - If this parameter is an object, the function
     * execution has thrown an uncaught exception and the exception is being stored in the <tt>exception</tt>
     * property of the parameter
     * */
    asyncFunctionExit: (iid: number, result: unknown, exceptionVal: { exception: unknown } | undefined) => void;

    asyncFunctionEnter: (iid: number) => void;

    awaitPre: (iid: number, promiseOrValAwaited: Promise<unknown> | unknown) => void;

    awaitPost: (iid: number, promiseOrValAwaited: Promise<unknown> | unknown, valResolveOrRejected: unknown, isPromiseRejected: boolean) => void;

    /**
     * Callbacks triggered before and after a statement.
     * Note that callback behavior may depend on Graal.js internals and NodeProf cannot guarantee that type values will
     * remain stable over time.
     *
     * @param iid source code location id
     * @param type Graal.js internal AST type of the statement
     **/
    startStatement: (iid: number, type: string) => void;

    /**
     * This callback is called when an execution terminates in node.js.  In a browser environment, the callback is
     * called if ChainedAnalyses.js or ChainedAnalysesNoCheck.js is used and Alt-Shift-T is pressed.
     *
     * @returns {void} - Any return value is ignored
     */
    endExecution: () => void;

    /**
     * This callback is called before a unary operation. Unary operations include  +, -, ~, !, typeof, void.
     *
     * @param iid - Static unique instruction identifier of this callback
     * @param op - Operation to be performed
     * @param left - Left operand
     * @returns  If an object is returned and the
     * <tt>skip</tt> property is true, then the unary operation is skipped.  Original <tt>op</tt> and <tt>left</tt>
     * are replaced with that from the returned object if an object is returned.
     * */
    unaryPre: (iid: number, op: string, left: unknown) => { op: unknown, left: unknown, skip: boolean } | void;
}