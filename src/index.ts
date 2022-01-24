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
        console.log(`filteredFPCount: ${StatisticsStore.getFilteredFPCount()}`);
        console.log(`ResourceCount: ${StatisticsStore.getTotalResourceCount()}`);
        console.log(`ResourceOperationCount: ${StatisticsStore.getTotalResourceOperationCount()}`);
        console.log(`CQPFPCount: ${StatisticsStore.getCallbackQueuePrioritiesFPCount()}`);
        console.log(`JSSFPCount: ${StatisticsStore.getJavaScriptSyntaxFPCount()}`);
    }
});