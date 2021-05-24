const fs = require('fs');

function printSync(content)
{
    fs.writeFileSync(1, `${content}\n`, {encoding: 'utf-8'});
}

module.exports = {printSync};