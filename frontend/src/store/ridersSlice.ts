import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ridersService } from '../services/riders.service';
import type { RiderData } from '../services/riders.service';

interface RidersState {
  items: RiderData[];
  loading: boolean;
  error: string | null;
}

const initialState: RidersState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchAllRiders = createAsyncThunk(
  'riders/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await ridersService.getAll();
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch riders');
    }
  }
);

export const updateRiderStatus = createAsyncThunk(
  'riders/updateStatus',
  async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
    try {
      const { data } = await ridersService.updateStatus(id, status);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to update rider status');
    }
  }
);

const ridersSlice = createSlice({
  name: 'riders',
  initialState,
  reducers: {
    clearRiders: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchAllRiders.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(fetchAllRiders.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; });
    builder.addCase(fetchAllRiders.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
    builder.addCase(updateRiderStatus.fulfilled, (state, action) => {
      const idx = state.items.findIndex(r => r._id === action.payload._id);
      if (idx !== -1) state.items[idx] = action.payload;
    });
  },
});

export const { clearRiders } = ridersSlice.actions;
export default ridersSlice.reducer;
