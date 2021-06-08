import Scope from './Scope';

class FunctionDeclaration
{
    private readonly func: Function;	// 函数对象
    private readonly scope: Scope;	// 定义时所在作用域

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