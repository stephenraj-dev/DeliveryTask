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
    socket.on('order_assigned', (data) => {
      // Refresh list to show the newly assigned order
      fetchOrders();
      showToast('New order assigned to you!', 'info');
    });
    
    socket.on('order_status_changed', (data) => {
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
        <h1 className="text-2xl font-bold text-gray-900">My Deliveries</h1>
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          <span className="text-sm font-medium text-gray-600">{isOnline ? 'Online' : 'Offline'}</span>
          <Button variant={isOnline ? 'danger' : 'success'} size="sm" onClick={handleToggleOnline}>
            Go {isOnline ? 'Offline' : 'Online'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col justify-center">
            <p className="text-xs font-medium text-gray-500 uppercase">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col justify-center">
            <p className="text-xs font-medium text-gray-500 uppercase">Total Delivered</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.delivered}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col justify-center">
            <p className="text-xs font-medium text-gray-500 uppercase">Total Failed</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.failed}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col justify-center">
            <p className="text-xs font-medium text-gray-500 uppercase">Performance</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.performance}%</p>
          </div>
        </div>
      )}

      <Card>
        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
        ) : error ? (
          <div className="text-center py-10"><p className="text-red-500">{error}</p><Button onClick={fetchOrders} variant="secondary" className="mt-3">Retry</Button></div>
        ) : orders.length === 0 ? (
          <p className="text-gray-400 text-center py-10">No deliveries assigned to you yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order._id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.pickupAddress} → {order.dropAddress}</p>
                    <p className="text-xs text-gray-500 mt-1">{order.packageDetails}</p>
                    {order.handoverNote && <p className="text-xs text-amber-600 mt-1 font-medium">{order.handoverNote}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={order.priority === 'urgent' ? 'danger' : 'default'}>{order.priority}</Badge>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getNextStatuses(order.status).length > 0 && (
                      <div className="flex gap-2">
                        {getNextStatuses(order.status).map(nextStatus => (
                          <Button
                            key={nextStatus}
                            size="sm"
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
                <p className="text-xs text-gray-400 mt-3">{new Date(order.createdAt).toLocaleString()}</p>
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
        <p className="text-sm text-gray-600">
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
        <p className="text-sm text-gray-600 mb-2">Please provide a reason for the failure:</p>
        <input className="w-full border border-gray-300 rounded-lg px-3 py-2" value={failReason} onChange={e => setFailReason(e.target.value)} placeholder="e.g. Client not reachable" />
      </Modal>
    </Layout>
  );
};