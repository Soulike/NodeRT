// DO NOT INSTRUMENT

import ResourceDeclaration from '../../Interface/ResourceDeclaration';
import CallbackFunction from '../../Class/CallbackFunction';
import MapOperation from './MapOperation';

class MapDeclaration implements ResourceDeclaration
{
    public readonly map: Map<unknown, unknown>;
    public readonly operations: Map<CallbackFunction, MapOperation[]>;

    constructor(map: Map<unknown, unknown>)
    {
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
}

export default MapDeclaration;