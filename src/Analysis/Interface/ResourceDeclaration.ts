import CallbackFunction from '../Class/CallbackFunction';
import ResourceOperation from './ResourceOperation';

interface ResourceDeclaration   // TODO: 封装和属性私有化
{
    readonly operations: Map<CallbackFunction, ResourceOperation[]>;
}

export default ResourceDeclaration;