const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    username: String,
    semester: String,
    department: String,
    grades: Object,
    cgpa: String
});

module.exports = mongoose.model('Submission', submissionSchema);
