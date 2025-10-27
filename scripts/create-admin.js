const bcrypt = require("bcryptjs");

const password = "Admin123!"; // Cambia esto
const hash = bcrypt.hashSync(password, 10);

console.log("Password hash:", hash);
