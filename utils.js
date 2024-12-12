const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function promptInput(question) {
    return new Promise(resolve => rl.question(question, answer => resolve(answer)));
}

function validateAmount(amount) {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
        console.log('Invalid amount. Please enter a positive number.');
        return false;
    }
    return true;
}

module.exports = { promptInput, validateAmount };
