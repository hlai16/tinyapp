const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedOutput = "userRandomID";
    // Write your assert statement here
    assert(user.id === expectedOutput, 'return an user with valid email');
  });

  it('should return undefined with a non-existent user', function() {
    const user = getUserByEmail("a@A.com", testUsers)
    const expectedOutput = undefined;
    // Write your assert statement here
    assert(user.id === expectedOutput, 'return undefined because no such e-mail in database.');
  });
});