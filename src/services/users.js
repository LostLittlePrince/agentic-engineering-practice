const usersQueries = require('../db/queries/users');
const { sendEmail } = require('./email');
const { validateEmail, isNonEmptyString } = require('../utils/validation');
const { isUniqueViolation } = require('../db/errors');

function listUsers() {
  return usersQueries.findAllUsers();
}

function getUserById(id) {
  return usersQueries.findUserById(id);
}

async function createUser({ name, email }) {
  if (!name || !isNonEmptyString(name)) {
    throw { status: 400, message: 'name is required' };
  }
  if (!email || !isNonEmptyString(email)) {
    throw { status: 400, message: 'email is required' };
  }
  if (!validateEmail(email)) {
    throw { status: 400, message: 'Invalid email address' };
  }

  let user;
  try {
    user = usersQueries.insertUser({ name, email });
  } catch (err) {
    if (isUniqueViolation(err)) throw { status: 409, message: 'email already exists' };
    throw err;
  }

  // TODO: move to a notification service
  await sendEmail({
    to: user.email,
    subject: 'Welcome to Taskr!',
    body: `Hi ${user.name}, your account is ready. Start managing your tasks at taskr.io.`
  });

  return user;
}

function updateUser(id, data) {
  const existing = usersQueries.findUserById(id);
  if (!existing) {
    throw { status: 404, message: 'User not found' };
  }
  return usersQueries.updateUser(id, {
    name: data.name !== undefined ? data.name : existing.name,
    email: data.email !== undefined ? data.email : existing.email
  });
}

function deleteUser(id) {
  if (!usersQueries.deleteUser(id)) {
    throw { status: 404, message: 'User not found' };
  }
  return { deleted: true };
}

module.exports = { listUsers, getUserById, createUser, updateUser, deleteUser };
