const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
    origin: ['https://www.adanateknotarim.org', 'https://adanateknotarim.org', 'http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
const authRoutes = require('./routes/auth.routes');
const mgmRoutes = require('./routes/mgm.routes');
// Prefix API routes
app.use('/api/auth', authRoutes);
app.use('/api/mgm', mgmRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'AgroMeta API is running', version: '1.0.0' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
