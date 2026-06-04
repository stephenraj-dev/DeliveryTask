import React, { useEffect, useState, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { showToast } from '../components/Toast';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchMyOrders, createOrder } from '../store/ordersSlice';
import type { OrderData } from '../services/orders.service';
import { socket } from '../services/socket';

export const ClientOrders: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { items: orders, loading, error } = useAppSelector(state => state.orders);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);

  // Form state
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [pkg, setPkg] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');

  // Compute stats from real fetched orders
  const stats = useMemo(() => ({
    total: orders.length,
    waitingPickup: orders.filter(o => o.status === 'assigned').length,
    waitingDelivery: orders.filter(o => o.status === 'picked_up').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    failed: orders.filter(o => o.status === 'failed').length,
  }), [orders]);

  const fetchOrders = () => {
    if (!user) return;
    dispatch(fetchMyOrders(user.id));
  };

  useEffect(() => { 
    fetchOrders(); 
    socket.on('order_assigned', (data) => {
      fetchOrders();
      showToast(`Your order has been assigned to ${data.riderName}`, 'info');
    });
    socket.on('order_status_changed', (data) => {
      fetchOrders();
      if (data.status === 'delivered') showToast('Your order has been delivered! 🎉', 'success');
      else showToast(`Order status updated to ${data.status.replace('_', ' ')}`, 'info');
    });
    return () => {
      socket.off('order_assigned');
      socket.off('order_status_changed');
    };
  }, [user, dispatch]);

  useEffect(() => {
    if (retryCountdown <= 0) return;
    const timer = setInterval(() => {
      setRetryCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); handleCreateOrder(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [retryCountdown]);

  const handleCreateOrder = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await dispatch(createOrder({ pickupAddress: pickup, dropAddress: drop, packageDetails: pkg, priority })).unwrap();
      showToast('Order placed successfully!', 'success');
      setPickup(''); setDrop(''); setPkg(''); setPriority('normal');
      fetchOrders();
    } catch (err) {
      if (err === 'NO_RIDERS') {
        showToast('No riders available. Will retry in 60 seconds.', 'error');
        setRetryCountdown(60);
      } else {
        showToast('Failed to create order.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
      delivered: 'success', assigned: 'info', picked_up: 'warning', failed: 'danger', pending: 'default',
    };
    return <Badge variant={map[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  const getRiderName = (order: OrderData): string => {
    if (order.riderId && typeof order.riderId === 'object') {
      return order.riderId.name;
    }
    return '';
  };

  const getStepTimestamp = (order: OrderData, step: string): string | null => {
    const map: Record<string, string | undefined> = {
      pending: order.createdAt,
      assigned: order.assignedAt,
      picked_up: order.pickedUpAt,
      delivered: order.deliveredAt,
      failed: order.deliveredAt,
    };
    return map[step] || null;
  };

  const formatDateTime = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <Button variant="secondary" size="sm" onClick={fetchOrders} disabled={loading}>Refresh Orders</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {/* Total Orders */}
        <div className="bg-white rounded-xl card-shadow border border-gray-100 p-5 flex flex-col justify-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="flex flex-col gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <div className="mt-2">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Total Orders</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{stats.total}</p>
            </div>
          </div>
        </div>

        {/* Waiting Pickup */}
        <div className="bg-white rounded-xl card-shadow border border-gray-100 p-5 flex flex-col justify-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="flex flex-col gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="mt-2">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Wait Pickup</p>
              <p className="text-3xl font-extrabold text-amber-500 mt-1">{stats.waitingPickup}</p>
            </div>
          </div>
        </div>

        {/* Waiting Delivery */}
        <div className="bg-white rounded-xl card-shadow border border-gray-100 p-5 flex flex-col justify-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="flex flex-col gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <svg className="w-5 h-5 text-[#1936A1]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
            </div>
            <div className="mt-2">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Wait Delivery</p>
              <p className="text-3xl font-extrabold text-[#1936A1] mt-1">{stats.waitingDelivery}</p>
            </div>
          </div>
        </div>

        {/* Delivered Orders */}
        <div className="bg-white rounded-xl card-shadow border border-gray-100 p-5 flex flex-col justify-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="flex flex-col gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div className="mt-2">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Delivered</p>
              <p className="text-3xl font-extrabold text-emerald-500 mt-1">{stats.delivered}</p>
            </div>
          </div>
        </div>

        {/* Failed Orders */}
        <div className="bg-white rounded-xl card-shadow border border-gray-100 p-5 flex flex-col justify-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="flex flex-col gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            </div>
            <div className="mt-2">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Failed</p>
              <p className="text-3xl font-extrabold text-red-500 mt-1">{stats.failed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Order Form */}
      <Card title="Place New Order" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Pickup Address</label>
            <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1936A1] focus:border-[#1936A1] outline-none transition-all duration-200 shadow-sm" value={pickup} onChange={e => setPickup(e.target.value)} placeholder="Enter pickup address" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Drop Address</label>
            <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1936A1] focus:border-[#1936A1] outline-none transition-all duration-200 shadow-sm" value={drop} onChange={e => setDrop(e.target.value)} placeholder="Enter drop address" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Package Details</label>
            <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1936A1] focus:border-[#1936A1] outline-none transition-all duration-200 shadow-sm" value={pkg} onChange={e => setPkg(e.target.value)} placeholder="Describe the package" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
            <select className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1936A1] focus:border-[#1936A1] outline-none transition-all duration-200 shadow-sm appearance-none" value={priority} onChange={e => setPriority(e.target.value as 'normal' | 'urgent')}>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <Button onClick={handleCreateOrder} loading={submitting} disabled={!pickup || !drop || !pkg || retryCountdown > 0}>
            {retryCountdown > 0 ? `Retrying in ${retryCountdown}s...` : 'Place Order'}
          </Button>
          {retryCountdown > 0 && <span className="text-sm text-amber-600 font-medium">No riders available. Auto-retrying...</span>}
        </div>
      </Card>

      {/* Orders List */}
      <Card title="Order History">
        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
        ) : error ? (
          <div className="text-center py-10"><p className="text-red-500">{error}</p><Button onClick={fetchOrders} variant="secondary" className="mt-3">Retry</Button></div>
        ) : orders.length === 0 ? (
          <p className="text-gray-400 text-center py-10">You haven't placed any orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <div
                key={order._id}
                onClick={() => setSelectedOrder(order)}
                className={`p-5 rounded-xl border cursor-pointer transition-all duration-300 hover:shadow-md ${
                  order.priority === 'urgent'
                    ? 'bg-red-50 border-red-100 hover:bg-red-100/50 hover:border-red-200'
                    : 'bg-white border-gray-100 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold text-gray-900">{order.pickupAddress} <span className="text-gray-400 mx-2">→</span> {order.dropAddress}</p>
                    <p className="text-sm text-gray-500 mt-1">{order.packageDetails}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      {order.priority === 'urgent' && <Badge variant="danger">Urgent</Badge>}
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                  {order.riderId && <p className="text-xs font-semibold text-[#1936A1]">Rider assigned</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Timeline Modal */}
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Order Details">
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Pickup:</span> <span className="font-medium">{selectedOrder.pickupAddress}</span></div>
              <div><span className="text-gray-500">Drop:</span> <span className="font-medium">{selectedOrder.dropAddress}</span></div>
              <div><span className="text-gray-500">Package:</span> <span className="font-medium">{selectedOrder.packageDetails}</span></div>
              <div><span className="text-gray-500">Priority:</span> <Badge variant={selectedOrder.priority === 'urgent' ? 'danger' : 'default'}>{selectedOrder.priority}</Badge></div>
            </div>

            {/* Assigned Rider */}
            {getRiderName(selectedOrder) && (
              <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-100">
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <span className="text-sm text-gray-500">Rider:</span>
                <span className="text-sm font-semibold text-indigo-700">{getRiderName(selectedOrder)}</span>
              </div>
            )}

            {/* Timeline */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3">Timeline</h4>
              <div className="relative ml-1.5">
                {['pending', 'assigned', 'picked_up', selectedOrder.status === 'failed' ? 'failed' : 'delivered'].map((step, i, arr) => {
                  const steps = ['pending', 'assigned', 'picked_up', selectedOrder.status === 'failed' ? 'failed' : 'delivered'];
                  const currentIdx = steps.indexOf(selectedOrder.status);
                  const done = i <= currentIdx;
                  const isLast = i === arr.length - 1;
                  const timestamp = done ? getStepTimestamp(selectedOrder, step) : null;
                  return (
                    <div key={step} className="flex gap-3 pb-4 last:pb-0">
                      {/* Vertical line + dot */}
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white ${
                          done
                            ? step === 'failed' ? 'bg-red-500' : 'bg-indigo-600'
                            : 'bg-gray-300'
                        }`} />
                        {!isLast && (
                          <div className={`w-0.5 flex-1 mt-1 ${done ? 'bg-indigo-300' : 'bg-gray-200'}`} />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 -mt-0.5">
                        <span className={`text-sm capitalize ${
                          done ? 'text-gray-900 font-medium' : 'text-gray-400'
                        }`}>
                          {step.replace('_', ' ')}
                        </span>
                        {timestamp && (
                          <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(timestamp)}</p>
                        )}
                        {done && step === 'assigned' && getRiderName(selectedOrder) && (
                          <p className="text-xs text-indigo-500 mt-0.5">Assigned to {getRiderName(selectedOrder)}</p>
                        )}
                        {done && step === 'assigned' && selectedOrder.handoverNote && (
                          <p className="text-xs text-amber-500 mt-0.5">{selectedOrder.handoverNote}</p>
                        )}
                        {done && step === 'failed' && selectedOrder.failureReason && (
                          <p className="text-xs text-red-500 mt-0.5">Reason: {selectedOrder.failureReason}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};