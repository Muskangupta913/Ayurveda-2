// hash.js
const bcrypt = require('bcryptjs');

const plainPassword = 'AdminStrong123!';
bcrypt.hash(plainPassword, 10).then((hashedPassword) => {
  console.log('Hashed password:', hashedPassword);
});
