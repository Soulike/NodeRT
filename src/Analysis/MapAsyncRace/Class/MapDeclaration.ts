// DO NOT INSTRUMENT

import CallbackFunction from '../../Class/CallbackFunction';
import MapOperation from './MapOperation';
import ResourceDeclaration from '../../Class/ResourceDeclaration';

class MapDeclaration extends ResourceDeclaration
{
    private readonly map: Map<unknown, unknown>;
    private readonly operations: Map<CallbackFunction, MapOperation[]>;

    constructor(map: Map<unknown, unknown>)
    {
        super();
        this.map = map;
        this.operations = new Map();
    }

    public is(other: Map<unknown, unknown>): boolean
    {
        return this.map === other;
    }

    public appendOperation(currentCallbackFunction: CallbackFunction, mapOperation: MapOperation)
    {
        const mapOperations = this.operations.get(currentCallbackFunction);
        if (mapOperations === undefined)
        {
            this.operations.set(currentCallbackFunction, [mapOperation]);
        }
        else
        {
            mapOperations.push(mapOperation);
        }
    }

    public getOperations()
    {
        return new Map(this.operations);
    }
}

export default MapDeclaration;