import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";
import { getErrorMessage } from "../../utils/getErrorMessage";

const initialState = {
  items: [],
  total: 0,
  page: 1,
  totalPages: 1,
  filters: { search: "", status: "", priority: "", project: "" },
  status: "idle",
  actionStatus: "idle",
  error: null,
};

const getId = (item) => item?._id?.toString?.() || item?._id || item?.toString?.() || item;

export const fetchTasks = createAsyncThunk(
  "tasks/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/tasks", { params });
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const createTask = createAsyncThunk(
  "tasks/create",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/tasks", payload);
      return data.task;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateTask = createAsyncThunk(
  "tasks/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/tasks/${id}`, payload);
      return data.task;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteTask = createAsyncThunk(
  "tasks/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/tasks/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setTaskFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearTaskError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.tasks;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createTask.pending, (state) => {
        state.actionStatus = "loading";
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        const createdId = getId(action.payload);
        state.items = [action.payload, ...state.items.filter((task) => getId(task) !== createdId)];
        state.total = Math.max(state.total, state.items.length);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.error = action.payload;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        const updatedId = getId(action.payload);
        const idx = state.items.findIndex((task) => getId(task) === updatedId);
        if (idx !== -1) state.items[idx] = action.payload;
        else state.items.unshift(action.payload);
        state.items = state.items.filter(
          (task, index, allTasks) =>
            allTasks.findIndex((candidate) => getId(candidate) === getId(task)) === index
        );
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t._id !== action.payload);
        state.total -= 1;
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { setTaskFilters, clearTaskError } = taskSlice.actions;
export default taskSlice.reducer;
