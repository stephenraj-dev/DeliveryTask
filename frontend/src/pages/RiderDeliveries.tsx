import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { showToast } from '../components/Toast';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchAssignedOrders, updateOrderStatus } from '../store/ordersSlice';
import { updateRiderStatus } from '../store/ridersSlice';
import { ordersService } from '../services/orders.service';
import type { OrderData, RiderStatsData } from '../services/orders.service';
import { socket } from '../services/socket';

export const RiderDeliveries: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { items: allOrders, loading, error } = useAppSelector(state => state.orders);
  const [isOnline, setIsOnline] = useState(user?.status === 'available');
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showFailModal, setShowFailModal] = useState(false);
  const [failReason, setFailReason] = useState('');
  const [failOrderId, setFailOrderId] = useState<string | null>(null);
  const [stats, setStats] = useState<RiderStatsData | null>(null);

  // Filter orders assigned to this rider
  const orders = allOrders.filter((o: OrderData) => {
    const riderId = typeof o.riderId === 'object' && o.riderId ? o.riderId._id : o.riderId;
    return riderId === user?.id;
  });

  const fetchOrders = async () => {
    dispatch(fetchAssignedOrders());
    try {
      const { data } = await ordersService.getAssignedStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch rider stats', err);
    }
  };

  useEffect(() => { 
    fetchOrders(); 
    socket.on('order_assigned', (_data) => {
      // Refresh list to show the newly assigned order
      fetchOrders();
      showToast('New order assigned to you!', 'info');
    });
    
    socket.on('order_status_changed', (_data) => {
      fetchOrders();
    });
    
    // Also listen for reassignments/offline sync if needed
    return () => { 
      socket.off('order_assigned'); 
      socket.off('order_status_changed');
    };
  }, [dispatch]);

  const activeCount = orders.filter(o => o.status !== 'delivered' && o.status !== 'failed').length;

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (newStatus === 'failed') {
      setFailOrderId(orderId);
      setShowFailModal(true);
      return;
    }
    setUpdatingId(orderId);
    try {
      await dispatch(updateOrderStatus({ id: orderId, data: { status: newStatus } })).unwrap();
      showToast(`Order status updated to ${newStatus.replace('_', ' ')}`, 'success');
      fetchOrders();
    } catch {
      showToast('Failed to update status.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmFail = async () => {
    if (!failReason.trim()) {
      showToast('Please enter a reason', 'error');
      return;
    }
    if (!failOrderId) return;
    
    setUpdatingId(failOrderId);
    try {
      await dispatch(updateOrderStatus({ id: failOrderId, data: { status: 'failed', failureReason: failReason } })).unwrap();
      showToast('Order marked as failed', 'success');
      fetchOrders();
    } catch {
      showToast('Failed to update status.', 'error');
    } finally {
      setUpdatingId(null);
      setShowFailModal(false);
      setFailReason('');
      setFailOrderId(null);
    }
  };

  const handleToggleOnline = () => {
    if (isOnline && activeCount > 0) {
      setShowOfflineModal(true);
      return;
    }
    const newStatus = isOnline ? 'offline' : 'available';
    if (user) {
      dispatch(updateRiderStatus({ id: user.id, status: newStatus }));
      setIsOnline(!isOnline);
      showToast(`You are now ${newStatus}`, 'info');
    }
  };

  const confirmOffline = async () => {
    if (user) {
      await dispatch(updateRiderStatus({ id: user.id, status: 'offline' })).unwrap();
      setIsOnline(false);
      setShowOfflineModal(false);
      showToast('You are now offline. Active orders will be reassigned.', 'info');
    }
  };

  const getNextStatuses = (current: string): string[] => {
    const map: Record<string, string[]> = {
      assigned: ['picked_up'],
      picked_up: ['delivered', 'failed'],
    };
    return map[current] || [];
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
      delivered: 'success', assigned: 'info', picked_up: 'warning', failed: 'danger', pending: 'default',
    };
    return <Badge variant={map[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">My Deliveries</h1>
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gray-500'}`} />
          <span className="text-sm font-medium text-gray-300">{isOnline ? 'Online' : 'Offline'}</span>
          <Button variant={isOnline ? 'danger' : 'success'} size="sm" onClick={handleToggleOnline}>
            Go {isOnline ? 'Offline' : 'Online'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 p-5 rounded-2xl flex flex-col justify-center transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:-translate-y-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500 -mr-10 -mt-10"></div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest relative z-10">Total Orders</p>
            <p className="text-3xl font-extrabold text-white mt-1 relative z-10">{stats.total}</p>
          </div>
          <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 p-5 rounded-2xl flex flex-col justify-center transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:-translate-y-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500 -mr-10 -mt-10"></div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest relative z-10">Total Delivered</p>
            <p className="text-3xl font-extrabold text-emerald-400 mt-1 relative z-10">{stats.delivered}</p>
          </div>
          <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 p-5 rounded-2xl flex flex-col justify-center transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:-translate-y-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-all duration-500 -mr-10 -mt-10"></div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest relative z-10">Total Failed</p>
            <p className="text-3xl font-extrabold text-red-400 mt-1 relative z-10">{stats.failed}</p>
          </div>
          <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 p-5 rounded-2xl flex flex-col justify-center transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:-translate-y-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500 -mr-10 -mt-10"></div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest relative z-10">Performance</p>
            <p className="text-3xl font-extrabold text-blue-400 mt-1 relative z-10">{stats.performance}%</p>
          </div>
        </div>
      )}

      <Card>
        {loading && orders.length === 0 ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
        ) : error ? (
          <div className="text-center py-10"><p className="text-red-500">{error}</p><Button onClick={fetchOrders} variant="secondary" className="mt-3">Retry</Button></div>
        ) : orders.length === 0 ? (
          <p className="text-gray-400 text-center py-10">No deliveries assigned to you yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order._id} className={`p-6 rounded-xl border transition-all duration-300 hover:shadow-md ${
                  order.priority === 'urgent'
                    ? 'bg-red-900/20 border-red-800/50'
                    : 'bg-gray-800/50 border-gray-700/50'
                }`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-base font-semibold text-gray-200">{order.pickupAddress} <span className="text-gray-500 mx-2">→</span> {order.dropAddress}</p>
                    <p className="text-sm text-gray-400 mt-1.5">{order.packageDetails}</p>
                    {order.handoverNote && <p className="text-sm text-amber-400 mt-2 font-medium bg-amber-900/30 p-2 rounded-lg inline-block border border-amber-800/50">{order.handoverNote}</p>}
                    <div className="flex items-center gap-2 mt-3">
                      {order.priority === 'urgent' && <Badge variant="danger">Urgent</Badge>}
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                    {getNextStatuses(order.status).length > 0 && (
                      <div className="flex gap-2 w-full sm:w-auto">
                        {getNextStatuses(order.status).map(nextStatus => (
                          <Button
                            key={nextStatus}
                            size="sm"
                            className="flex-1 sm:flex-none"
                            variant={nextStatus === 'failed' ? 'danger' : nextStatus === 'delivered' ? 'success' : 'primary'}
                            loading={updatingId === order._id}
                            onClick={() => handleStatusChange(order._id, nextStatus)}
                          >
                            {nextStatus === 'picked_up' ? 'Pick Up' : nextStatus === 'delivered' ? 'Deliver' : 'Failed'}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <p className="text-xs font-semibold text-gray-500">Assigned: {new Date(order.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Offline Confirmation Modal */}
      <Modal
        isOpen={showOfflineModal}
        onClose={() => setShowOfflineModal(false)}
        title="Go Offline?"
        footer={<><Button variant="secondary" onClick={() => setShowOfflineModal(false)}>Cancel</Button><Button variant="danger" onClick={confirmOffline}>Confirm</Button></>}
      >
        <p className="text-sm text-gray-400">
          You have <strong>{activeCount}</strong> active orders. Going offline will auto-reassign all your orders. Are you sure?
        </p>
      </Modal>

      {/* Failure Reason Modal */}
      <Modal
        isOpen={showFailModal}
        onClose={() => setShowFailModal(false)}
        title="Failure Reason"
        footer={<><Button variant="secondary" onClick={() => setShowFailModal(false)}>Cancel</Button><Button variant="danger" onClick={confirmFail}>Confirm</Button></>}
      >
        <p className="text-sm text-gray-400 mb-2">Please provide a reason for the failure:</p>
        <input className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" value={failReason} onChange={e => setFailReason(e.target.value)} placeholder="e.g. Client not reachable" />
      </Modal>
    </Layout>
  );
};