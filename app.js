import express from 'express';
import mongoose from 'mongoose';
import Task from './models/Task.js';
import * as dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

function asyncHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      if (error.name === 'ValidationError') {
        res.status(400).send({ message: error.message});
      } else if (error.name === 'CastError') {
        res.status(404).send({ message: 'Cannot find given id.' });
      } else {
        res.status(500).send({ message: error.message });
      }
      }
  }
};

app.get('/tasks', asyncHandler(async (req, res) => {
  const { sort } = req.query;
  const count = Number(req.query.count) || 0;

  const sortOption = { createdAt: sort === 'oldest' ? 'asc' : 'desc' };
  const tasks = await Task.find().sort(sortOption).limit(count);

  res.send(tasks);
}));

app.get('/tasks/:id', asyncHandler(async (req, res) => {
  const { id } = req.params.id;
  const task = await Task.findById(id);
  if (task) {
    return res.send(task);
  }
  return res.status(404).send({ message: 'Task not found' });
}));

app.post('/tasks', asyncHandler(async (req, res) => {
  const newTask = await Task.create(req.body);
  res.status(201).send(newTask);
}));

app.patch('/tasks/:id', asyncHandler(async (req, res) => {
  const { id } = req.params.id;
  const task = await Task.findById(id);
  if (task) {
    Object.keys(req.body).forEach((key) => {
      task[key] = req.body[key];
    });
    task.updatedAt = new Date();
    await task.save();
    return res.send(task);
  }
  return res.status(404).send({ message: 'Task not found' });
}));

app.delete('/tasks/:id', asyncHandler(async(req, res) => {
  const { id } = req.params.id;
  const task = await Task.findByIdAndDelete(id);
  if (task) {
    res.sendStatus(204);
  } else {
    res.status(404).send({ message: 'Cannot find given id.' });
  }
}));


app.listen(process.env.PORT, () => console.log('Server Started'));

mongoose.connect(process.env.DATABASE_URL).then(() => console.log('Connected to DB'));
