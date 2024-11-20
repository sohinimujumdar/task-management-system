require('dotenv').config(); // Load environment variables
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const http = require('http');  // Required for WebSocket integration
const socketIo = require('socket.io');  // WebSocket library

mongoose.set('strictQuery', true); // Suppress deprecation warning

const app = express();
const server = http.createServer(app);  // Create a server instance
const io = socketIo(server);  // Initialize socket.io with the server

app.use(express.json());
app.use(cors());
console.log(process.env);  // Print all environment variables

console.log("MongoDB URL:", process.env.MONGO_URL); // Debugging

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("Connected to db"))
.catch(console.error);

// Task model
const Task = require('./models/tasks');

// WebSocket event: Listen for new connections
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Routes
app.get('/tasks', async (req, res) => {
    try {
        const tasks = await Task.find();
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/task/new', async (req, res) => {
    try {
        const task = new Task({
            text: req.body.text,
            priority: req.body.priority
        });
        await task.save();
        
        // Emit an event to notify all connected clients
        io.emit('new-task', task);  // Send the new task to all connected clients
        
        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/task/delete/:id', async (req, res) => {
    try {
        const result = await Task.findByIdAndDelete(req.params.id);
        
        // Emit an event when a task is deleted
        io.emit('delete-task', req.params.id);  // Send the task ID to all connected clients
        
        res.json({ result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/task/update/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });

        task.text = req.body.text;
        await task.save();

        // Emit an event when a task is updated
        io.emit('update-task', task);  // Send the updated task to all connected clients

        res.json(task);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start the server
server.listen(3001, () => {
    console.log("Server started on port 3001");
});
