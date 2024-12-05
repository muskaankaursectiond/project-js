const fs = require("fs");
const User = require("./user");
const ETransfer = require("./etransfer");
const { promptInput, validateAmount } = require("./utils");

class BankingApp {
  constructor() {
    this.users = [];
    this.pendingTransfers = [];
    this.loadData();
  }

  loadData() {
    try {
      const usersData = fs.readFileSync("./users.json");
      this.users = JSON.parse(usersData).map(
        (user) => new User(user.email, user.pin, user.balance)
      );

      const transfersData = fs.readFileSync("./transfers.json");
      this.pendingTransfers = JSON.parse(transfersData).map(
        (transfer) =>
          new ETransfer(
            transfer.sender,
            transfer.recipient,
            transfer.amount,
            transfer.securityQuestion,
            transfer.securityAnswer
          )
      );
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  saveData() {
    fs.writeFileSync("./users.json", JSON.stringify(this.users, null, 2));
    fs.writeFileSync(
      "./transfers.json",
      JSON.stringify(this.pendingTransfers, null, 2)
    );
  }
  async authenticateUser() {
    let attempts = 0;
    while (attempts < 3) {
      const email = await promptInput("Enter your email: ");
      const pin = await promptInput("Enter your PIN: ");

      const user = this.users.find((user) => user.email === email);
      if (user && user.authenticate(pin)) {
        return user;
      }

      attempts++;
      console.log("Invalid email or PIN. Try again.");
    }

    console.log("Too many failed attempts. Exiting.");
    return null;
  }
  async mainMenu(user) {
    while (true) {
      console.log("\nMain Menu");
      console.log("1. View Balance");
      console.log("2. Deposit Funds");
      console.log("3. Withdraw Funds");
      console.log("4. Send E-Transfer");
      console.log("5. Accept E-Transfer");
      console.log("6. Change PIN");
      console.log("7. Exit");

      const choice = await promptInput("Choose an option: ");

      switch (choice) {
        case "1":
          console.log(`Your balance is: $${user.viewBalance()}`);
          break;

        case "2":
          const depositAmount = await promptInput("Enter amount to deposit: ");
          if (validateAmount(depositAmount)) {
            user.deposit(parseFloat(depositAmount));
            console.log("Deposit successful.");
            console.log(`Your balance is: $${user.viewBalance()}`);
          }
          break;
          
        case "3":
          const withdrawAmount = await promptInput(
            "Enter amount to withdraw: "
          );
          if (
            validateAmount(withdrawAmount) &&
            user.withdraw(parseFloat(withdrawAmount))
          ) {
            console.log("Withdrawal successful.");
            console.log(`Your balance is: $${user.viewBalance()}`);
          } else {
            console.log("Insufficient funds.");
          }
          break;
        
        case "6":
          const newPin = await promptInput("Enter new PIN: ");
          user.pin = newPin;
          console.log("PIN changed successfully.");
          break;

        case "7":
          this.saveData();
          console.log("Thank you for using the banking app. Goodbye!");
          return;
        default:
          console.log("Invalid choice. Try again.");
      }
    }
  }

  async start() {
    const user = await this.authenticateUser();
    if (user) {
      await this.mainMenu(user);
    }
  }
}

module.exports = BankingApp;
