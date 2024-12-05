class User {
    constructor(email, pin, balance = 0) {
        this.email = email;
        this.pin = pin;
        this.balance = balance;
    }

    authenticate(pin) {
        return this.pin === pin;
    }

    viewBalance() {
        return this.balance;
    }
    deposit(amount) {
        this.balance += amount;
    }

    withdraw(amount) {
        if (this.balance >= amount) {
            this.balance -= amount;
            return true;
        }
        return false;
    }
}

module.exports = User;