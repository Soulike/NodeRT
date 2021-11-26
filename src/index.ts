// DO NOT INSTRUMENT

import './Analysis';
import {StatisticsStore} from './LogStore/StatisticsStore';
import {shouldBeVerbose} from './Util';

console.time('entry');

process.on('exit', () =>
{
    if (shouldBeVerbose())
    {
        console.timeEnd('entry');
        console.log(`eventCount: ${StatisticsStore.getEventCount()}`);
        console.log(`raceCount: ${StatisticsStore.getRaceCount()}`);
        console.log(`filteredRaceCount: ${StatisticsStore.getFilteredRaceCount()}`);
        console.log(`ResourceCount: ${StatisticsStore.getTotalResourceCount()}`);
        console.log(`ResourceOperationCount: ${StatisticsStore.getTotalResourceOperationCount()}`);
    }
});