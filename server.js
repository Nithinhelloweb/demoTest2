const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const Subject = require('./models/Subject');
const Submission = require('./models/Submission');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve default home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// ------------------ API ROUTES ------------------ //

// GET: Fetch subjects (with optional filters)
app.get('/api/subjects', async (req, res) => {
  const { semester, department, batch } = req.query;
  const filter = {};

  if (semester) filter.semester = semester;
  if (department) filter.department = department;
  if (batch) filter.batch = batch;

  try {
    const subjects = await Subject.find(filter);
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching subjects' });
  }
});

// POST: Add a new subject
app.post('/api/subjects', async (req, res) => {
  const { label, credit, semester, department, batch } = req.body;

  if (!label || !credit || !semester || !department || !batch) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const newSubject = new Subject({ label, credit, semester, department, batch });
    await newSubject.save();
    res.json({ message: 'Subject added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding subject' });
  }
});

// DELETE: Remove subject by ID
app.delete('/api/subjects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await Subject.findByIdAndDelete(id);
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting subject' });
  }
});

// POST: Save student CGPA submission
app.post('/submit-cgpa', async (req, res) => {
  const { username, title, grades, cgpa } = req.body;

  if (!username || !title || !grades || !cgpa) {
    return res.status(400).json({ message: 'Incomplete data' });
  }

  const [semester, ...deptParts] = title.split(" ");
  const department = deptParts.join(" ");

  try {
    const newSubmission = new Submission({
      username,
      semester,
      department,
      grades,
      cgpa
    });

    await newSubmission.save();
    res.json({ message: "CGPA submitted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error submitting CGPA' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
