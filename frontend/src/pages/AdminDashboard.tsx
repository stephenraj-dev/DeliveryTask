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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { socket } from '../services/socket';

export const AdminDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items: orders, loading: ordersLoading, error: ordersError } = useAppSelector(state => state.orders);
  const { items: riders } = useAppSelector(state => state.riders);
  const { summary: analytics } = useAppSelector(state => state.analytics);
  console.log("admin :", analytics);
  console.log("admin order :", orders);

  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [confirmRider, setConfirmRider] = useState<RiderData | null>(null);
  const [selectedPieRiderId, setSelectedPieRiderId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

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
    socket.on('rider_offline', () => fetchData());
    
    return () => {
      socket.off('order_assigned');
      socket.off('order_status_changed');
      socket.off('rider_offline');
    };
  }, [dispatch]);

  useEffect(() => {
    if (riders.length > 0 && !selectedPieRiderId) {
      setSelectedPieRiderId(riders[0]._id);
    }
  }, [riders, selectedPieRiderId]);

  const sortedOrders = [...orders].sort((a, b) => {
    if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
    if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
  const paginatedOrders = sortedOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: string) => {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
      delivered: 'success', assigned: 'info', picked_up: 'warning', failed: 'danger', pending: 'default',
    };
    return <Badge variant={map[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  const getRowClasses = (order: OrderData) => {
    if (order.status === 'failed') return 'border-l-4 border-red-500 line-through text-gray-500 bg-gray-800/30';
    if (order.status === 'delivered') return 'border-l-4 border-emerald-500';
    if (order.priority === 'urgent') return 'border-l-4 border-red-500 bg-red-900/20';
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

  const dynamicZoneData = React.useMemo(() => {
    if (!orders || orders.length === 0) return [];
    const zoneMap: Record<string, number> = {};
    orders.forEach(order => {
      // Basic dynamic zone extraction from pickup address
      let zone = 'Central Area';
      const addr = order.pickupAddress.toLowerCase();
      if (addr.includes('north')) zone = 'North Zone';
      else if (addr.includes('south')) zone = 'South Zone';
      else if (addr.includes('east')) zone = 'East Zone';
      else if (addr.includes('west')) zone = 'West Zone';
      else {
        const parts = order.pickupAddress.split(',');
        if (parts.length > 1) {
          zone = parts[parts.length - 1].trim();
        } else {
          const words = order.pickupAddress.split(' ');
          zone = words.length > 0 ? words[0] + ' Area' : 'Central Area';
        }
      }
      
      // Capitalize first letter
      zone = zone.charAt(0).toUpperCase() + zone.slice(1);
      zoneMap[zone] = (zoneMap[zone] || 0) + 1;
    });
    return Object.entries(zoneMap).map(([zone, totalOrders]) => ({ zone, totalOrders }));
  }, [orders]);

  const pieChartData = React.useMemo(() => {
    if (!selectedPieRiderId) return [];
    const riderOrders = orders.filter(o => {
      if (typeof o.riderId === 'object' && o.riderId !== null) return o.riderId._id === selectedPieRiderId;
      return o.riderId === selectedPieRiderId;
    });

    const stats = { assigned: 0, picked_up: 0, delivered: 0, failed: 0 };
    riderOrders.forEach(o => {
      if (o.status === 'assigned') stats.assigned++;
      if (o.status === 'picked_up') stats.picked_up++;
      if (o.status === 'delivered') stats.delivered++;
      if (o.status === 'failed') stats.failed++;
    });

    return [
      { name: 'Assigned', value: stats.assigned, color: '#3B82F6' },
      { name: 'Picked Up', value: stats.picked_up, color: '#F59E0B' },
      { name: 'Delivered', value: stats.delivered, color: '#10B981' },
      { name: 'Failed', value: stats.failed, color: '#EF4444' },
    ].filter(d => d.value > 0);
  }, [orders, selectedPieRiderId]);

  if (ordersLoading && orders.length === 0) return <Layout><div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1936A1]" /></div></Layout>;
  if (ordersError) return <Layout><div className="text-center py-20"><p className="text-red-500 text-lg">{ordersError}</p><Button onClick={fetchData} className="mt-4">Retry</Button></div></Layout>;

  return (
    <Layout>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 p-6 rounded-2xl flex flex-col justify-center transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:-translate-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500 -mr-10 -mt-10"></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider relative z-10">Total Orders</p>
          <p className="text-4xl font-extrabold text-white mt-2 relative z-10">{analytics?.totalOrders ?? orders.length}</p>
        </div>
        <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 p-6 rounded-2xl flex flex-col justify-center transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:-translate-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500 -mr-10 -mt-10"></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider relative z-10">Delivered</p>
          <p className="text-4xl font-extrabold text-emerald-400 mt-2 relative z-10">{analytics?.delivered ?? orders.filter(o => o.status === 'delivered').length}</p>
        </div>
        <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 p-6 rounded-2xl flex flex-col justify-center transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:-translate-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500 -mr-10 -mt-10"></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider relative z-10">Success Rate</p>
          <p className="text-4xl font-extrabold text-blue-400 mt-2 relative z-10">{analytics?.successRate ? `${Math.round(analytics.successRate)}%` : `${Math.round((orders.filter(o => o.status === 'delivered').length / (orders.length || 1)) * 100)}%`}</p>
        </div>
        <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 p-6 rounded-2xl flex flex-col justify-center transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:-translate-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-500 -mr-10 -mt-10"></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider relative z-10">Pending</p>
          <p className="text-4xl font-extrabold text-amber-400 mt-2 relative z-10">{analytics?.pending ?? orders.filter(o => o.status === 'assigned').length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Orders Table */}
        <div className="lg:col-span-3">
          <Card title="Orders" subtitle={`${orders.length} total orders`}>
            {sortedOrders.length === 0 ? (
              <p className="text-gray-400 text-center py-10">No orders found.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-gray-400 border-b border-gray-700 bg-gray-800/50">
                      <th className="py-4 px-4 font-bold uppercase tracking-wider text-[11px]">Order ID</th>
                      <th className="py-4 px-4 font-bold uppercase tracking-wider text-[11px]">Priority</th>
                      <th className="py-4 px-4 font-bold uppercase tracking-wider text-[11px]">Rider</th>
                      <th className="py-4 px-4 font-bold uppercase tracking-wider text-[11px]">Status</th>
                      <th className="py-4 px-4 font-bold uppercase tracking-wider text-[11px]">Created</th>
                    </tr></thead>
                    <tbody>
                      {paginatedOrders.map(order => (
                        <tr key={order._id} onClick={() => setSelectedOrder(order)} className={`border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer transition-colors ${getRowClasses(order)}`}>
                          <td className="py-4 px-4 font-mono text-xs text-gray-400">{order._id.substring(0, 10)}...</td>
                          <td className="py-4 px-4"><Badge variant={order.priority === 'urgent' ? 'danger' : 'default'}>{order.priority}</Badge></td>
                          <td className="py-4 px-4 font-medium text-gray-200">{getRiderName(order.riderId)}</td>
                          <td className="py-4 px-4">{getStatusBadge(order.status)}</td>
                          <td className="py-4 px-4 text-gray-400 text-xs font-medium">{new Date(order.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4 px-4">
                    <Button 
                      disabled={currentPage === 1} 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      variant="secondary"
                      size="sm"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-400">Page {currentPage} of {totalPages}</span>
                    <Button 
                      disabled={currentPage === totalPages} 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      variant="secondary"
                      size="sm"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </Card>

          {/* Analytics */}
          {dynamicZoneData.length > 0 && (
            <Card title="Zone-wise Order Volume (Live)" className="mt-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dynamicZoneData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                    <XAxis dataKey="zone" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                    <Tooltip cursor={{fill: '#374151'}} contentStyle={{borderRadius: '8px', border: '1px solid #374151', backgroundColor: '#1F2937', color: '#FFF', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)'}} />
                    <Bar dataKey="totalOrders" fill="#3B82F6" radius={[4,4,0,0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {analytics && analytics.riderPerformance && analytics.riderPerformance.length > 0 && (
            <Card title="Rider Performance" className="mt-6">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Delivered</th>
                  <th className="pb-3 font-medium">Failed</th>
                  <th className="pb-3 font-medium">Avg Time</th>
                </tr></thead>
                <tbody>
                  {analytics.riderPerformance.map((r, i) => (
                    <tr key={i} className="border-b border-gray-700/50">
                      <td className="py-3 font-medium text-gray-200">{r.riderName}</td>
                      <td className="py-3 text-emerald-400">{r.delivered}</td>
                      <td className="py-3 text-red-400">{r.failed}</td>
                      <td className="py-3 text-gray-400">{r.avgTime} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>

        {/* Rider Sidebar */}
        <div className="space-y-6">
          <Card title="Riders" subtitle={`${riders.length} riders`}>
            {riders.length === 0 ? (
              <p className="text-gray-400 text-center py-6">No riders found.</p>
            ) : (
              <div className="space-y-3">
                {riders.map(rider => (
                  <div key={rider._id} className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getRiderDot(rider.status)}
                      <div>
                        <p className="text-sm font-medium text-gray-200">{rider.name}</p>
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

          <Card title="Performance" className="relative">
            {riders.length > 0 && (
              <div className="absolute top-5 right-6 z-10">
                <select 
                  className="bg-gray-700 text-sm text-white rounded-md px-3 py-1.5 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  value={selectedPieRiderId}
                  onChange={(e) => setSelectedPieRiderId(e.target.value)}
                >
                  {riders.map(r => (
                    <option key={r._id} value={r._id}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="h-64 mt-4">
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '8px', border: '1px solid #374151', backgroundColor: '#1F2937', color: '#FFF'}} itemStyle={{color: '#E5E7EB'}} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px', color: '#9CA3AF'}} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  No orders found for this rider.
                </div>
              )}
            </div>
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
            {/* Assigned Rider */}
            {getRiderName(selectedOrder.riderId) !== 'Unassigned' && (
              <div className="flex items-center gap-2 px-3 py-2 bg-indigo-900/30 rounded-lg border border-indigo-800">
                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <span className="text-sm text-gray-400">Rider:</span>
                <span className="text-sm font-semibold text-indigo-300">{getRiderName(selectedOrder.riderId)}</span>
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
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-gray-800 ${
                          done
                            ? step === 'failed' ? 'bg-red-500' : 'bg-indigo-500'
                            : 'bg-gray-700'
                        }`} />
                        {!isLast && (
                          <div className={`w-0.5 flex-1 mt-1 ${done ? 'bg-indigo-500' : 'bg-gray-700'}`} />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 -mt-0.5">
                        <span className={`text-sm capitalize ${
                          done ? 'text-white font-medium' : 'text-gray-500'
                        }`}>
                          {step.replace('_', ' ')}
                        </span>
                        {timestamp && (
                          <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(timestamp)}</p>
                        )}
                        {done && step === 'assigned' && getRiderName(selectedOrder.riderId) !== 'Unassigned' && (
                          <p className="text-xs text-indigo-500 mt-0.5">Assigned to {getRiderName(selectedOrder.riderId)}</p>
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

      {/* Confirm Offline Modal */}
      <Modal
        isOpen={!!confirmRider}
        onClose={() => setConfirmRider(null)}
        title="Confirm Offline"
        footer={<><Button variant="secondary" onClick={() => setConfirmRider(null)}>Cancel</Button><Button variant="danger" onClick={confirmOffline}>Confirm</Button></>}
      >
        <p className="text-sm text-gray-400">
          Rider <strong>{confirmRider?.name}</strong> has {confirmRider?.activeOrders} active orders.
          Going offline will auto-reassign all orders. Are you sure?
        </p>
      </Modal>
    </Layout>
  );
};