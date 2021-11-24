// DO NOT INSTRUMENT

import {PrimitiveDeclaration} from './PrimitiveDeclaration';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';

type ScopeType = 'block' | 'function';

export class Scope
{
    public static GLOBAL_SCOPE = new Scope('function', 'global', null,null, [], null);

    public readonly id: number; // for debug
    public readonly type: ScopeType;
    public readonly name: string | null;
    public readonly func: Function|null;    // if the scope is a function scope, store the function
    public readonly parent: Scope | null;	// null for global
    public readonly declarations: PrimitiveDeclaration[];
    public readonly sourceCodeInfo: SourceCodeInfo | null;  // null for global

    constructor(type: ScopeType, name: string | null, func: Function|null, parent: Scope | null, declarations: PrimitiveDeclaration[], sourceCodeInfo: SourceCodeInfo | null)
    {
        this.id = Date.now();
        this.type = type;
        this.name = name;
        this.func = func;
        this.parent = parent;
        this.declarations = declarations;
        this.sourceCodeInfo = sourceCodeInfo;
    }

    public getDeclarationByName(name: string): PrimitiveDeclaration | null
    {
        for (let i = this.declarations.length - 1; i >= 0; i--)
        {
            if (this.declarations[i]!.getResourceInfo().getName() === name)
            {
                return this.declarations[i]!;
            }
        }
        if (this.parent === null)
        {
            return null;
        }
        else
        {
            return this.parent.getDeclarationByName(name);
        }
    }

    public getDeclarationByIid(iid: number): PrimitiveDeclaration | null
    {
        for (const declaration of this.declarations)
        {
            if (declaration.getResourceInfo().getIid() === iid)
            {
                return declaration;
            }
        }
        if (this.parent === null)
        {
            return null;
        }
        else
        {
            return this.parent.getDeclarationByIid(iid);
        }
    }

    public toJSON()
    {
        return {
            ...this,
            declarations: undefined,
        };
    }
}