const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  label: String,
  credit: Number,
  semester: String,
  department: String,
  batch: String  // ✅ must include batch
});

module.exports = mongoose.model('Subject', subjectSchema);
