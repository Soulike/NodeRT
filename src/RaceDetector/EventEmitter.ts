// DO NOT INSTRUMENT

import EventEmitter from 'events';
import {aggressiveDetector} from './AggressiveDetector';
import {conservativeDetector} from './ConservativeDetector';

export const eventEmitter = new EventEmitter();
export const EVENT = Object.freeze({
    OPERATION_APPENDED: 'operationAppended'
});

eventEmitter.on(EVENT.OPERATION_APPENDED, conservativeDetector);
eventEmitter.on(EVENT.OPERATION_APPENDED, aggressiveDetector);