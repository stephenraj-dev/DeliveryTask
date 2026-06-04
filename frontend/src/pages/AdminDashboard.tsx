import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { showToast } from '../components/Toast';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchAllOrders } from '../store/ordersSlice';
import { fetchAllRiders, updateRiderStatus } from '../store/ridersSlice';
import { fetchAnalyticsSummary } from '../store/analyticsSlice';
import type { OrderData } from '../services/orders.service';
import type { RiderData } from '../services/riders.service';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { socket } from '../services/socket';

export const AdminDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items: orders, loading: ordersLoading, error: ordersError } = useAppSelector(state => state.orders);
  const { items: riders } = useAppSelector(state => state.riders);
  const { summary: analytics } = useAppSelector(state => state.analytics);

  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [confirmRider, setConfirmRider] = useState<RiderData | null>(null);

  const fetchData = () => {
    dispatch(fetchAllOrders(undefined));
    dispatch(fetchAllRiders());
    dispatch(fetchAnalyticsSummary());
  };

  useEffect(() => { 
    fetchData(); 
    
    // Live updates via socket
    socket.on('order_assigned', () => fetchData());
    socket.on('order_status_changed', () => fetchData());
    
    return () => {
      socket.off('order_assigned');
      socket.off('order_status_changed');
    };
  }, [dispatch]);

  const sortedOrders = [...orders].sort((a, b) => {
    if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
    if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getStatusBadge = (status: string) => {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
      delivered: 'success', assigned: 'info', picked_up: 'warning', failed: 'danger', pending: 'default',
    };
    return <Badge variant={map[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  const getRowClasses = (order: OrderData) => {
    if (order.status === 'failed') return 'border-l-4 border-red-500 line-through text-gray-400';
    if (order.status === 'delivered') return 'border-l-4 border-emerald-500';
    if (order.priority === 'urgent') return 'border-l-4 border-red-400 bg-red-50/30';
    return 'border-l-4 border-transparent';
  };

  const getRiderDot = (status: string) => {
    const colors: Record<string, string> = { available: 'bg-emerald-500', busy: 'bg-amber-500', offline: 'bg-gray-400' };
    return <span className={`w-2.5 h-2.5 rounded-full inline-block ${colors[status] || 'bg-gray-400'}`} />;
  };

  const handleToggleRider = async (rider: RiderData) => {
    if (rider.status !== 'offline' && rider.activeOrders > 0) {
      setConfirmRider(rider);
      return;
    }
    const newStatus = rider.status === 'offline' ? 'available' : 'offline';
    await dispatch(updateRiderStatus({ id: rider._id, status: newStatus }));
    showToast(`Rider ${rider.name} is now ${newStatus}`, 'info');
    fetchData();
  };

  const confirmOffline = async () => {
    if (!confirmRider) return;
    await dispatch(updateRiderStatus({ id: confirmRider._id, status: 'offline' }));
    showToast(`Rider ${confirmRider.name} set offline. Orders reassigned.`, 'info');
    setConfirmRider(null);
    fetchData();
  };

  const getRiderName = (riderId: OrderData['riderId']) => {
    if (!riderId) return 'Unassigned';
    if (typeof riderId === 'object' && riderId.name) return riderId.name;
    return String(riderId).substring(0, 8) + '...';
  };

  if (ordersLoading) return <Layout><div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" /></div></Layout>;
  if (ordersError) return <Layout><div className="text-center py-20"><p className="text-red-500 text-lg">{ordersError}</p><Button onClick={fetchData} className="mt-4">Retry</Button></div></Layout>;

  return (
    <Layout>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{analytics?.totalOrders ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Delivered</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{analytics?.delivered ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Success Rate</p>
          <p className="text-3xl font-bold text-indigo-600 mt-1">{analytics?.successRate ? `${Math.round(analytics.successRate)}%` : '0%'}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{analytics?.pending ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Orders Table */}
        <div className="lg:col-span-3">
          <Card title="Orders" subtitle={`${orders.length} total orders`}>
            {sortedOrders.length === 0 ? (
              <p className="text-gray-400 text-center py-10">No orders found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-gray-500 border-b">
                    <th className="pb-3 font-medium">Order ID</th>
                    <th className="pb-3 font-medium">Priority</th>
                    <th className="pb-3 font-medium">Rider</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Created</th>
                  </tr></thead>
                  <tbody>
                    {sortedOrders.map(order => (
                      <tr key={order._id} onClick={() => setSelectedOrder(order)} className={`border-b hover:bg-gray-50 cursor-pointer transition-colors ${getRowClasses(order)}`}>
                        <td className="py-3 font-mono text-xs">{order._id.substring(0, 10)}...</td>
                        <td className="py-3"><Badge variant={order.priority === 'urgent' ? 'danger' : 'default'}>{order.priority}</Badge></td>
                        <td className="py-3">{getRiderName(order.riderId)}</td>
                        <td className="py-3">{getStatusBadge(order.status)}</td>
                        <td className="py-3 text-gray-500">{new Date(order.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Analytics */}
          {analytics && analytics.zoneWiseSummary && analytics.zoneWiseSummary.length > 0 && (
            <Card title="Zone-wise Order Volume" className="mt-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.zoneWiseSummary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="zone" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalOrders" fill="#6366f1" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {analytics && analytics.riderPerformance && analytics.riderPerformance.length > 0 && (
            <Card title="Rider Performance" className="mt-6">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500 border-b">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Delivered</th>
                  <th className="pb-3 font-medium">Failed</th>
                  <th className="pb-3 font-medium">Avg Time</th>
                </tr></thead>
                <tbody>
                  {analytics.riderPerformance.map((r, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-3 font-medium">{r.riderName}</td>
                      <td className="py-3 text-emerald-600">{r.delivered}</td>
                      <td className="py-3 text-red-600">{r.failed}</td>
                      <td className="py-3">{r.avgTime} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>

        {/* Rider Sidebar */}
        <div>
          <Card title="Riders" subtitle={`${riders.length} riders`}>
            {riders.length === 0 ? (
              <p className="text-gray-400 text-center py-6">No riders found.</p>
            ) : (
              <div className="space-y-3">
                {riders.map(rider => (
                  <div key={rider._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getRiderDot(rider.status)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{rider.name}</p>
                        <p className="text-xs text-gray-500">{rider.activeOrders} active</p>
                      </div>
                    </div>
                    <Button size="sm" variant={rider.status === 'offline' ? 'success' : 'secondary'} onClick={() => handleToggleRider(rider)}>
                      {rider.status === 'offline' ? 'Online' : 'Offline'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Order Detail Modal */}
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Order Timeline">
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Pickup:</span> <span className="font-medium">{selectedOrder.pickupAddress}</span></div>
              <div><span className="text-gray-500">Drop:</span> <span className="font-medium">{selectedOrder.dropAddress}</span></div>
              <div><span className="text-gray-500">Package:</span> <span className="font-medium">{selectedOrder.packageDetails}</span></div>
              <div><span className="text-gray-500">Priority:</span> <Badge variant={selectedOrder.priority === 'urgent' ? 'danger' : 'default'}>{selectedOrder.priority}</Badge></div>
            </div>
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3">Timeline</h4>
              <div className="space-y-3">
                {['pending', 'assigned', 'picked_up', selectedOrder.status === 'failed' ? 'failed' : 'delivered'].map((step, i) => {
                  const steps = ['pending', 'assigned', 'picked_up', selectedOrder.status === 'failed' ? 'failed' : 'delivered'];
                  const currentIdx = steps.indexOf(selectedOrder.status);
                  const done = i <= currentIdx;
                  return (
                    <div key={step} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${done ? 'bg-indigo-600' : 'bg-gray-300'}`} />
                      <span className={`text-sm capitalize ${done ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{step.replace('_', ' ')}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Offline Modal */}
      <Modal
        isOpen={!!confirmRider}
        onClose={() => setConfirmRider(null)}
        title="Confirm Offline"
        footer={<><Button variant="secondary" onClick={() => setConfirmRider(null)}>Cancel</Button><Button variant="danger" onClick={confirmOffline}>Confirm</Button></>}
      >
        <p className="text-sm text-gray-600">
          Rider <strong>{confirmRider?.name}</strong> has {confirmRider?.activeOrders} active orders.
          Going offline will auto-reassign all orders. Are you sure?
        </p>
      </Modal>
    </Layout>
  );
};