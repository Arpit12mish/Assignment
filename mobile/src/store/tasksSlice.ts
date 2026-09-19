import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  createTaskRequest,
  deleteTaskRequest,
  fetchTasks,
  toggleTaskCompleteRequest,
  updateTaskRequest,
} from '../api/tasks';
import { extractErrorMessage } from '../api/client';
import { NewTaskInput, Task, TaskFilter, TaskSort } from '../types';
import { sortTasksBy } from '../utils/sortTasks';
import { logout } from './authSlice';

interface TasksState {
  items: Task[];
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  filter: TaskFilter;
  sortMode: TaskSort;
}

const initialState: TasksState = {
  items: [],
  status: 'idle',
  error: null,
  filter: 'all',
  sortMode: 'smart',
};

// Thunks below all follow the same shape: call the API, and on failure turn the axios
// error into a plain string via rejectWithValue so the slice/UI never has to know about
// axios — `action.payload` in the `rejected` case is always a human-readable message.

export const loadTasks = createAsyncThunk(
  'tasks/load',
  async (sort: TaskSort, { rejectWithValue }) => {
    try {
      return await fetchTasks({ sort });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  },
);

export const addTask = createAsyncThunk(
  'tasks/add',
  async (input: NewTaskInput, { rejectWithValue }) => {
    try {
      return await createTaskRequest(input);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  },
);

export const editTask = createAsyncThunk(
  'tasks/edit',
  async ({ id, input }: { id: string; input: Partial<NewTaskInput> }, { rejectWithValue }) => {
    try {
      return await updateTaskRequest(id, input);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  },
);

export const toggleTaskComplete = createAsyncThunk(
  'tasks/toggleComplete',
  async (id: string, { rejectWithValue }) => {
    try {
      return await toggleTaskCompleteRequest(id);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  },
);

export const removeTask = createAsyncThunk(
  'tasks/remove',
  async (id: string, { rejectWithValue }) => {
    try {
      await deleteTaskRequest(id);
      return id;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  },
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setFilter(state, action: PayloadAction<TaskFilter>) {
      state.filter = action.payload;
    },
    // Re-sorts the already-loaded list in place — switching modes is instant and
    // doesn't need a network round trip, since the server-side sort is only used
    // for the initial `loadTasks` fetch.
    setSortMode(state, action: PayloadAction<TaskSort>) {
      state.sortMode = action.payload;
      state.items = sortTasksBy(action.payload, state.items);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadTasks.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadTasks.fulfilled, (state, action: PayloadAction<Task[]>) => {
        state.status = 'idle';
        state.items = sortTasksBy(state.sortMode, action.payload);
      })
      .addCase(loadTasks.rejected, (state, action) => {
        state.status = 'error';
        state.error = (action.payload as string) || 'Failed to load tasks';
      })
      // create/edit/toggle all re-sort the in-memory list with the current mode so the
      // new/changed task immediately lands in its correct position without a re-fetch.
      .addCase(addTask.fulfilled, (state, action: PayloadAction<Task>) => {
        state.items = sortTasksBy(state.sortMode, [...state.items, action.payload]);
      })
      .addCase(editTask.fulfilled, (state, action: PayloadAction<Task>) => {
        state.items = sortTasksBy(
          state.sortMode,
          state.items.map(t => (t.id === action.payload.id ? action.payload : t)),
        );
      })
      .addCase(toggleTaskComplete.fulfilled, (state, action: PayloadAction<Task>) => {
        state.items = sortTasksBy(
          state.sortMode,
          state.items.map(t => (t.id === action.payload.id ? action.payload : t)),
        );
      })
      .addCase(removeTask.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter(t => t.id !== action.payload);
      })
      .addCase(logout.fulfilled, state => {
        state.items = [];
        state.status = 'idle';
        state.error = null;
      });
  },
});

export const { setFilter, setSortMode } = tasksSlice.actions;
export default tasksSlice.reducer;
