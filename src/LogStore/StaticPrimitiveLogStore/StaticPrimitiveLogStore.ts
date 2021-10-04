import {StaticPrimitiveDeclaration} from './Class/StaticPrimitiveDeclaration';

export class StaticPrimitiveLogStore
{
    private static iidToDeclarations = new Map<number, StaticPrimitiveDeclaration[]>();
    private static declarations: StaticPrimitiveDeclaration[] = [];

    /**
     * @returns - If not found, returns `null`
     */
    public static getDeclaration(iid: number, name: string): StaticPrimitiveDeclaration | null
    {
        const declarationsInIid = StaticPrimitiveLogStore.iidToDeclarations.get(iid);
        if (declarationsInIid === undefined)
        {
            return null;
        }
        let declarationWithName: StaticPrimitiveDeclaration | null = null;
        for (const declaration of declarationsInIid)
        {
            if (declaration.name === name)
            {
                declarationWithName = declaration;
                break;
            }
        }
        return declarationWithName;
    }

    public static getDeclarations(): ReadonlyArray<StaticPrimitiveDeclaration>
    {
        return this.declarations;
    }

    public static appendDeclaration(iidWhenDefined: number, name: string)
    {
        const newDeclaration = new StaticPrimitiveDeclaration(iidWhenDefined, name);
        this.declarations.push(newDeclaration);
        const declarationsInIid = this.iidToDeclarations.get(iidWhenDefined) ?? [];
        declarationsInIid.push(newDeclaration);
        this.iidToDeclarations.set(iidWhenDefined, declarationsInIid);
    }
}
