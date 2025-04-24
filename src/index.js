/**
 * AI Agent Framework
 * Main entry point
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ 
    status: 'online',
    message: 'AI Agent Framework is running'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`AI Agent Framework running on port ${PORT}`);
}); 