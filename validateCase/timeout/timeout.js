let globalVar = 0;

function timeout()
{
    setTimeout(() =>
    {
        globalVar++;
        setTimeout(() =>
        {
            globalVar++;
        }, 50);
    }, 50);
}

module.exports = {
    timeout
}