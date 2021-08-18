const {sum} = require('../sum');
const {describe, it, expect} = require('@jest/globals')
describe(sum, () =>
{
    it('should handle 0 argument', function ()
    {
        expect(sum()).toBe(0);
    });
});

describe(sum, () =>
{
    it('should handle 1 argument', function ()
    {
        expect(sum(1)).toBe(1);
    });
});
describe(sum, () =>
{
    it('should handle 2 arguments', function ()
    {
        expect(sum(1, 2)).toBe(3);
    });
});

describe(sum, () =>
{
    it('should handle more than 2 arguments', function ()
    {
        expect(sum(1, 2, 3, 4, 5)).toBe(15);
    });
});