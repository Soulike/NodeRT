// DO NOT INSTRUMENT

import {ResourceDeclaration} from '../LogStore/Class/ResourceDeclaration';
import {ViolationInfo} from './ViolationInfo';

export interface Detector
{
    (resourceDeclaration: ResourceDeclaration): ViolationInfo | null
}