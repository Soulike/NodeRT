// DO NOT INSTRUMENT

import {ResourceDeclaration} from '../LogStore/Class/ResourceDeclaration';
import {Info} from './Info';

export interface Detector
{
    (resourceDeclaration: ResourceDeclaration): Info[];
}