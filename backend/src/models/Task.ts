import { Schema, model, Document, Types } from 'mongoose';
import { Priority } from '../types';

export interface TaskDocument extends Document {
  title: string;
  description?: string;
  dateTime: Date;
  deadline: Date;
  priority: Priority;
  category?: string;
  completed: boolean;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<TaskDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    // dateTime = when the task is scheduled to be worked on; deadline = when it's due.
    // Both feed the smart-sort urgency score (see utils/sortTasks.ts).
    dateTime: { type: Date, required: true },
    deadline: { type: Date, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    // Free-text rather than a fixed enum, so the client's category filter chips can be
    // built from whatever values a given user has actually used.
    category: { type: String, trim: true, default: 'General' },
    completed: { type: Boolean, default: false },
    // Indexed because every task query is scoped by owner (see taskController.ts).
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true },
);

// Mongoose's default JSON has `_id`/`__v`; remap to a plain `id` so the mobile app's
// TypeScript `Task` type doesn't need to special-case Mongo's field names.
taskSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Task = model<TaskDocument>('Task', taskSchema);
