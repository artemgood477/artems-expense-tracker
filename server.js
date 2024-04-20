const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = 3000;

mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});

const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  description: String,
  amount: Number,
  category: String,
  date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Expense = mongoose.model('Expense', expenseSchema);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/register', async (req, res) => {
  try {
    // Check if the email already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Create a new user
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password
    });

    const savedUser = await newUser.save();

    res.status(200).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
      const user = await User.findOne({ email, password });
      if (user) {
          res.status(200).json({ userId: user._id }); // Send userId upon successful login
      } else {
          res.status(401).json({ message: 'Invalid credentials' });
      }
  } catch (err) {
      console.error('Error logging in user:', err);
      res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/logout', (req, res) => {
  res.sendStatus(200);
});

app.get('/main.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

app.get('/expenses', async (req, res) => {
  try {
    const userId = req.query.userId;
    const month = req.query.month;
    let expenses;
    if (month) {
      const startOfMonth = new Date(new Date().getFullYear(), month - 1, 1);
      const endOfMonth = new Date(new Date().getFullYear(), month, 0);
      expenses = await Expense.find({ userId, date: { $gte: startOfMonth, $lte: endOfMonth } });
    } else {
      expenses = await Expense.find({ userId });
    }
    res.json(expenses);
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/expenses', async (req, res) => {
  try {
    const { userId, description, amount, category, date } = req.body;
    const newExpense = new Expense({ userId, description, amount, category, date });
    const savedExpense = await newExpense.save();
    res.status(201).json(savedExpense);
  } catch (err) {
    console.error('Error adding expense:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/expenses/:id', async (req, res) => {
  try {
    const expenseId = req.params.id;
    await Expense.findByIdAndDelete(expenseId);
    res.sendStatus(204);
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
