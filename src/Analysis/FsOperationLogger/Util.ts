import fs from 'fs';

export function willFileBeCreatedOrTruncated(flags: string | number): boolean
{
    return (typeof flags === 'string' && flags.includes('w'))
        || (typeof flags === 'number' && (
            flags & (fs.constants.O_CREAT
                | fs.constants.O_TRUNC)) !== 0);
}