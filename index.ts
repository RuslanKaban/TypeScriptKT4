type JSONResponse = {
    status: number;
    text: string;
    message: string;
};

type User = {
    uid: string;
    login: string;
    password: string;
    online: boolean;
    verified: boolean;
    phone?: string;
    age?: number;
    cardNumber?: string;
    geo?: string;
    balance: { [token: string]: number };
    transactionHistory: string[]; 
};

let users: User[] = [];

const validateLogin = (login: string): boolean => /^[a-zA-Z0-9]+$/.test(login);
const validatePassword = (password: string): boolean => password.length >= 6;

const generateUID = (): string => Math.random().toString(36).substr(2, 9);

const findUserByLogin = (login: string): User | undefined => users.find(user => user.login === login);
const findUserByUID = (uid: string): User | undefined => users.find(user => user.uid === uid);

const signUp = (login: string, password: string, confirmPassword: string): JSONResponse => {
    if (password !== confirmPassword) {
        return { status: 400, text: "Bad Request", message: "Passwords do not match" };
    }
    if (!validateLogin(login) || !validatePassword(password)) {
        return { status: 400, text: "Bad Request", message: "Invalid login or password" };
    }
    if (findUserByLogin(login)) {
        return { status: 409, text: "Conflict", message: "Login already taken" };
    }
    
   
    const newUser: User = {
        uid: generateUID(),
        login,
        password,
        online: false,
        verified: false,
        balance: { 'USD': 0, 'BTC': 0 },
        transactionHistory: [] 
    };

    users.push(newUser);
    return signIn(login, password);
};


const signIn = (login: string, password: string): JSONResponse => {
    const user = findUserByLogin(login);
    if (!user || user.password !== password) {
        return { status: 401, text: "Unauthorized", message: "Invalid login or password" };
    }
    user.online = true;
    return { status: 200, text: "OK", message: "login success" };
};

const verify = (login: string, password: string, phone: string, age: number, cardNumber: string, geo: string): JSONResponse => {
    const user = findUserByLogin(login);
    if (!user || user.password !== password) {
        return { status: 401, text: "Unauthorized", message: "Invalid login or password" };
    }
    user.phone = phone;
    user.age = age;
    user.cardNumber = cardNumber;
    user.geo = geo;
    user.verified = true;
    return { status: 200, text: "OK", message: "verification success" };
};

const forgetPwd = (phone: string, password: string): JSONResponse => {
    const user = users.find(user => user.phone === phone);
    if (!user) {
        return { status: 404, text: "Not Found", message: "User not found" };
    }
    user.password = password;
    return { status: 200, text: "OK", message: "password reset success" };
};

const transactionTrigger = (senderUID: string, receiverUID: string, amount: number, token: string): JSONResponse => {
    const sender = findUserByUID(senderUID);
    const receiver = findUserByUID(receiverUID);
    if (!sender || !receiver) {
        return { status: 404, text: "Not Found", message: "User not found" };
    }
    if (sender.balance[token] < amount) {
        return { status: 400, text: "Bad Request", message: "Insufficient balance" };
    }
    sender.balance[token] -= amount;
    receiver.balance[token] += amount;
    return { status: 200, text: "OK", message: "Transaction successful" };
};

const transactionReceive = (receiverUID: string, senderUID: string, amount: number, token: string): JSONResponse => {
    const sender = findUserByUID(senderUID);
    const receiver = findUserByUID(receiverUID);
    if (!sender || !receiver) {
        return { status: 404, text: "Not Found", message: "User not found" };
    }
    if (sender.balance[token] < amount || receiver.balance[token] < amount) {
        return { status: 400, text: "Bad Request", message: "Insufficient balance" };
    }
    sender.balance[token] -= amount;
    receiver.balance[token] += amount;

    if (!sender.transactionHistory) {
        sender.transactionHistory = [];
    }
    if (!receiver.transactionHistory) {
        receiver.transactionHistory = [];
    }

    const transactionDetails = `${sender.login} sent ${amount} ${token} to ${receiver.login}`;
    sender.transactionHistory.push(transactionDetails);
    receiver.transactionHistory.push(transactionDetails);

    return { status: 200, text: "OK", message: "Transaction received and processed" };
};

const changePassword = (login: string, oldPassword: string, newPassword: string): JSONResponse => {
    const user = findUserByLogin(login);
    if (!user || user.password !== oldPassword) {
        return { status: 401, text: "Unauthorized", message: "Invalid login or password" };
    }
    user.password = newPassword;
    return { status: 200, text: "OK", message: "Password changed successfully" };
};

const addToken = (uid: string, token: string, initialBalance: number): JSONResponse => {
    const user = findUserByUID(uid);
    if (!user) {
        return { status: 404, text: "Not Found", message: "User not found" };
    }
    if (user.balance[token]) {
        return { status: 409, text: "Conflict", message: "Token already exists for user" };
    }
    user.balance[token] = initialBalance;
    return { status: 200, text: "OK", message: "Token added successfully" };
};

console.log(signUp("user1", "password123", "password123"));
console.log(signIn("user1", "password123"));

console.log(changePassword("user1", "password123", "newpassword"));

console.log(addToken("uid123", "ETH", 10));

console.log(transactionTrigger("senderUID123", "receiverUID456", 5, "BTC"));
console.log(transactionReceive("receiverUID456", "senderUID123", 5, "BTC"));
