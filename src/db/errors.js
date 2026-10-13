function isUniqueViolation(err) {
  return err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY';
}

module.exports = { isUniqueViolation };
