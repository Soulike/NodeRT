function sum(...numbers)
{
    let numberSum = 0;

    for (const number of numbers)
    {
        numberSum += number;
    }
    return numberSum;
};

module.exports = {
    sum,
}