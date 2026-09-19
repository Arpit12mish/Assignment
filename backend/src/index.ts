import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import aiRoutes from './routes/aiRoutes';
import { notFound, errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);

// notFound/errorHandler must be registered last — Express treats middleware order as
// significant, and errorHandler only catches errors passed to `next(err)` by routes
// registered before it.
app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/todo_app';

// The server only starts accepting requests once MongoDB is reachable, so a request
// never race-hits a controller before `mongoose.connect` has resolved.
connectDB(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
