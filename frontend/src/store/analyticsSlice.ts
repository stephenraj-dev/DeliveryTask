import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { analyticsService } from '../services/analytics.service';
import type { AnalyticsSummary } from '../services/analytics.service';

interface AnalyticsState {
  summary: AnalyticsSummary | null;
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  summary: null,
  loading: false,
  error: null,
};

export const fetchAnalyticsSummary = createAsyncThunk(
  'analytics/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await analyticsService.getSummary();
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics');
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearAnalytics: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchAnalyticsSummary.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(fetchAnalyticsSummary.fulfilled, (state, action) => { state.loading = false; state.summary = action.payload; });
    builder.addCase(fetchAnalyticsSummary.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

export const { clearAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer;
