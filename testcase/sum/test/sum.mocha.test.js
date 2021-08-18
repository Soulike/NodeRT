const {sum} = require('../sum');
const assert = require('assert');

describe(sum.name, () =>
{
    it('should handle 0 argument', function ()
    {
        assert.equal(sum(0), 0);
    });
});

describe(sum.name, () =>
{
    it('should handle 1 argument', function ()
    {
        assert.equal(sum(1), 1);
    });
});

describe(sum.name, () =>
{
    it('should handle 2 arguments', function ()
    {
        assert.equal(sum(1, 2), 3);
    });
});

describe(sum.name, () =>
{
    it('should handle more than 2 arguments', function ()
    {
        assert.equal(sum(1, 2, 3, 4, 5), 15);
    });
});