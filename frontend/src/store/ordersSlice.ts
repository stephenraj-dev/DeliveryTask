import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ordersService } from '../services/orders.service';
import type { OrderData } from '../services/orders.service';

interface OrdersState {
  items: OrderData[];
  loading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchAllOrders = createAsyncThunk(
  'orders/fetchAll',
  async (params: Record<string, string> | undefined, { rejectWithValue }) => {
    try {
      const { data } = await ordersService.getAll(params);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const fetchMyOrders = createAsyncThunk(
  'orders/fetchMy',
  async (clientId: string, { rejectWithValue }) => {
    try {
      const { data } = await ordersService.getMy(clientId);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const fetchAssignedOrders = createAsyncThunk(
  'orders/fetchAssigned',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await ordersService.getAssigned();
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch assigned orders');
    }
  }
);

export const createOrder = createAsyncThunk(
  'orders/create',
  async (
    payload: { pickupAddress: string; dropAddress: string; packageDetails: string; priority: 'normal' | 'urgent' },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await ordersService.create(payload);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string } } };
      if (error.response?.status === 503) {
        return rejectWithValue('NO_RIDERS');
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to create order');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateStatus',
  async ({ id, data }: { id: string; data: { status: string; proofPhoto?: string; failureReason?: string } }, { rejectWithValue }) => {
    try {
      const res = await ordersService.updateStatus(id, data);
      return res.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to update order status');
    }
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearOrders: () => initialState,
  },
  extraReducers: (builder) => {
    // fetchAllOrders
    builder.addCase(fetchAllOrders.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(fetchAllOrders.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; });
    builder.addCase(fetchAllOrders.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
    // fetchMyOrders
    builder.addCase(fetchMyOrders.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(fetchMyOrders.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; });
    builder.addCase(fetchMyOrders.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
    // fetchAssignedOrders
    builder.addCase(fetchAssignedOrders.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(fetchAssignedOrders.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; });
    builder.addCase(fetchAssignedOrders.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
    // createOrder
    builder.addCase(createOrder.fulfilled, (state, action) => { state.items.unshift(action.payload); });
    // updateOrderStatus
    builder.addCase(updateOrderStatus.fulfilled, (state, action) => {
      const idx = state.items.findIndex(o => o._id === action.payload._id);
      if (idx !== -1) state.items[idx] = action.payload;
    });
  },
});

export const { clearOrders } = ordersSlice.actions;
export default ordersSlice.reducer;
