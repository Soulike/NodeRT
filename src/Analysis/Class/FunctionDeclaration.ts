import Scope from './Scope';

class FunctionDeclaration
{
    private readonly func: Function;	// 函数对象
    private readonly scope: Scope;	// 自身的作用域，父作用域是定义所在的作用域

    constructor(func: Function, scope: Scope)
    {
        this.func = func;
        this.scope = scope;
    }

    public isFunction(other: Function): boolean
    {
        return this.func === other;
    }

    public getScope(): Scope
    {
        return this.scope;
    }
}

export default FunctionDeclaration;