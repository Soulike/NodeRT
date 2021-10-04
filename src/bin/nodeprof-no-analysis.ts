import {Sandbox} from '../Type/nodeprof';
import {shouldBeVerbose} from '../Util';

(function (_sandbox: Sandbox)
{
    const startTimestamp = Date.now();
    const endTimestamp = Date.now() - startTimestamp;

    process.on('exit', () =>
    {
        if (shouldBeVerbose())
        {
            console.log(`analysis load: ${endTimestamp / 1000}s`);
        }
    });
}(J$));