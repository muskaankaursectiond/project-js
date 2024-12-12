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
        (user) => new User(user.email, user.pin, user.balance, user.failedAttempts)
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
  
      if (!user) {
        console.log("User not found!");
        attempts++;
        continue;
      }
  
      if (user.failedAttempts >= 10) {
        console.log("Your account is permanently blocked due to too many failed attempts.");
        return null;
      }
  
      if (user.authenticate(pin)) {
        console.log("Login successfully!");
        user.failedAttempts = 0; // Reset failed attempts on successful login
        this.saveData();
        return user;
      } else {
        console.log("Incorrect PIN. Try again.");
        user.failedAttempts = (user.failedAttempts || 0) + 1;
        attempts++;
        this.saveData();
  
        if (user.failedAttempts >= 10) {
          console.log("Your account is permanently blocked due to too many failed attempts.");
          return null;
        }
      }
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
            console.log(`Your updated balance is: $${user.viewBalance()}`);
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
            console.log(`Your updated balance is: $${user.viewBalance()}`);
          } else {
            console.log("Insufficient funds.");
          }
          break;
        
        case "4":
          const recipientEmail = await promptInput("Enter recipient's email: ");
          const amountToSend = await promptInput("Enter amount to send: ");
          const securityQuestion = await promptInput(
            "Set a security question for the recipient: "
          );
          const securityAnswer = await promptInput(
            "Set the answer for the security purpose: "
          );

          if (!validateAmount(amountToSend)) {
            console.log("Invalid amount. Please try again.");
            break;
          }

          if (!user.withdraw(parseFloat(amountToSend))) {
            console.log("Insufficient funds.");
            break;
          }

          const recipientExists = this.users.find(
            (u) => u.email === recipientEmail
          );
          if (!recipientExists) {
            console.log("Recipient does not exist.");
            break;
          }

          const transfer = new ETransfer(
            user.email,
            recipientEmail,
            parseFloat(amountToSend),
            securityQuestion,
            securityAnswer
          );

          this.pendingTransfers.push(transfer);
          console.log("E-Transfer sent successfully.");
          this.saveData();
          break;
        case "5":
          const incomingTransfers = this.pendingTransfers.filter(
            (t) => t.recipient === user.email
          );

          if (incomingTransfers.length === 0) {
            console.log("No pending e-transfers for your account.");
            break;
          }

          for (const transfer of incomingTransfers) {
            console.log(`From: ${transfer.sender}`);
            console.log(`Amount: $${transfer.amount}`);
            console.log(`Security Question: ${transfer.securityQuestion}`);

            const answer = await promptInput(
              "Enter the answer to the security question: "
            );
            if (transfer.validateAnswer(answer)) {
              user.deposit(transfer.amount);
              console.log("E-Transfer accepted successfully.");
              this.pendingTransfers = this.pendingTransfers.filter(
                (t) => t !== transfer
              );
            } else {
              console.log("Incorrect answer. Transfer not accepted.");
            }
          }

          this.saveData();
          break;
        
        case "6":
          const newPin = await promptInput("Enter new PIN: ");
          const reEnterPin = await promptInput("re-Enter new PIN: ");
          if(newPin === reEnterPin){
          user.pin = newPin;
          console.log("PIN changed successfully.");
          }else{
            console.log("Please enter the correct pin");
          }
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
