import CallbackFunction from '../Class/CallbackFunction';
import ResourceOperation from './ResourceOperation';

interface ResourceDeclaration
{
    readonly name: unknown;
    readonly operations: Map<CallbackFunction, ResourceOperation[]>;
}

export default ResourceDeclaration;