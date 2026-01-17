// src/components/tracking/TaskTrackingDetail.jsx
import React, { useState } from 'react';
import { 
  FiBell, FiClock, FiCheckCircle, FiEye, 
  FiTrendingUp, FiZap, FiCalendar, FiBarChart2,
  FiPieChart, FiActivity, FiTarget
} from 'react-icons/fi';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, 
  Pie, Cell, LineChart, Line
} from 'recharts';

const TaskTrackingDetail = ({ task, trackingData, onClose }) => {
  const [timeRange, setTimeRange] = useState('7d');
  const [chartType, setChartType] = useState('bar');

  if (!trackingData) {
    return (
      <div className="bg-white rounded-xl p-6">
        <div className="text-center py-8">
          <FiBell className="text-4xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tracking Data</h3>
          <p className="text-gray-600 mb-4">
            No notification tracking data available for this task yet.
          </p>
        </div>
      </div>
    );
  }

  const stats = {
    totalNotifications: trackingData.totalNotifications || 0,
    snoozedCount: trackingData.snoozedCount || 0,
    viewedAt: trackingData.viewedAt,
    completedAt: trackingData.completedAt,
    confirmationCount: trackingData.confirmationTimes?.length || 0,
    lastNotification: trackingData.lastNotification,
    notificationTypes: trackingData.notificationTypes || {}
  };

  // Prepare chart data
  const prepareChartData = () => {
    let daysBack = 7;
    
    if (timeRange === '30d') daysBack = 30;
    if (timeRange === '90d') daysBack = 90;
    if (timeRange === 'all') daysBack = 365;

    const data = [];
    for (let i = daysBack; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Count notifications for this date
      const dailyCount = trackingData.notificationHistory?.filter(n => {
        const notifDate = new Date(n.timestamp).toISOString().split('T')[0];
        return notifDate === dateStr;
      }).length || 0;

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: dateStr,
        notifications: dailyCount,
        snoozes: trackingData.notificationHistory?.filter(n => {
          const notifDate = new Date(n.timestamp).toISOString().split('T')[0];
          return notifDate === dateStr && n.notificationType === 'snooze';
        }).length || 0,
        completions: trackingData.notificationHistory?.filter(n => {
          const notifDate = new Date(n.timestamp).toISOString().split('T')[0];
          return notifDate === dateStr && n.notificationType === 'completion';
        }).length || 0
      });
    }

    return data;
  };

  const chartData = prepareChartData();
  const notificationTypeData = Object.entries(stats.notificationTypes).map(([type, count]) => ({
    name: type.replace('_', ' ').toUpperCase(),
    value: count,
    color: type === 'reminder' ? '#3B82F6' : 
           type === 'snooze' ? '#F59E0B' : 
           type === 'completion' ? '#10B981' : 
           type === 'update' ? '#8B5CF6' : '#6B7280'
  }));

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiBell className="text-2xl text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Notification Tracking</h2>
              <p className="text-gray-600">Detailed analytics for: {task?.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Notifications</p>
                <p className="text-2xl font-bold text-blue-800 mt-1">{stats.totalNotifications}</p>
              </div>
              <FiBell className="text-blue-500 text-xl" />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Snoozes</p>
                <p className="text-2xl font-bold text-amber-800 mt-1">{stats.snoozedCount}</p>
                <p className="text-xs text-amber-600 mt-1">
                  Avg: {stats.totalNotifications > 0 ? 
                    (stats.snoozedCount / stats.totalNotifications * 100).toFixed(1) : 0}%
                </p>
              </div>
              <FiZap className="text-amber-500 text-xl" />
            </div>
          </div>

          <div className="bg-green-50 border border-green-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Confirmations</p>
                <p className="text-2xl font-bold text-green-800 mt-1">{stats.confirmationCount}</p>
                {stats.completedAt && (
                  <p className="text-xs text-green-600 mt-1">
                    Completed: {formatTime(stats.completedAt)}
                  </p>
                )}
              </div>
              <FiCheckCircle className="text-green-500 text-xl" />
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Last Viewed</p>
                <p className="text-lg font-bold text-purple-800 mt-1">
                  {formatTime(stats.viewedAt)}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  {stats.viewedAt ? formatDate(stats.viewedAt) : 'Never'}
                </p>
              </div>
              <FiEye className="text-purple-500 text-xl" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="space-y-6">
          {/* Chart Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Notification Activity</h3>
            <div className="flex flex-wrap gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
              </select>
            </div>
          </div>

          {/* Main Chart */}
          <div className="bg-gray-50 rounded-lg p-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="notifications" 
                    name="Notifications" 
                    fill="#3B82F6" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="snoozes" 
                    name="Snoozes" 
                    fill="#F59E0B" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="completions" 
                    name="Confirmations" 
                    fill="#10B981" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="notifications" 
                    name="Notifications" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="snoozes" 
                    name="Snoozes" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Pie Chart for Notification Types */}
          {notificationTypeData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4 h-64">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Notification Types</h4>
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie
                      data={notificationTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {notificationTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Timeline of Events */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Recent Activity Timeline</h4>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {trackingData.notificationHistory?.slice(0, 10).map((notification, index) => (
                    <div key={index} className="flex items-start gap-3 p-2 hover:bg-white rounded-lg">
                      <div className={`mt-1 w-3 h-3 rounded-full ${
                        notification.notificationType === 'completion' ? 'bg-green-500' :
                        notification.notificationType === 'snooze' ? 'bg-amber-500' :
                        notification.notificationType === 'reminder' ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`} />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {notification.notificationType.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        {notification.metadata && (
                          <div className="text-xs text-gray-600 mt-1">
                            {notification.metadata.snoozeCount && (
                              <span className="mr-2">Snooze #{notification.metadata.snoozeCount}</span>
                            )}
                            {notification.metadata.oldProgress !== undefined && (
                              <span>Progress: {notification.metadata.oldProgress}% → {notification.metadata.newProgress}%</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Stats Table */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Detailed Statistics</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metric
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">First Notification</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {trackingData.notificationHistory?.length > 0 ? 
                      formatDate(trackingData.notificationHistory[trackingData.notificationHistory.length - 1].timestamp) : 
                      'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {trackingData.notificationHistory?.length > 0 ? 
                      trackingData.notificationHistory[trackingData.notificationHistory.length - 1].notificationType : 
                      ''}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Last Notification</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {stats.lastNotification ? formatDate(stats.lastNotification.timestamp) : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                    {stats.lastNotification?.notificationType?.replace('_', ' ') || ''}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Average Snooze Rate</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {stats.totalNotifications > 0 ? 
                      ((stats.snoozedCount / stats.totalNotifications) * 100).toFixed(1) + '%' : 
                      '0%'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {stats.snoozedCount} snoozes out of {stats.totalNotifications} notifications
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Time to Completion</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {trackingData.firstNotificationAt && stats.completedAt ? 
                      (() => {
                        const first = new Date(trackingData.firstNotificationAt);
                        const completed = new Date(stats.completedAt);
                        const diffDays = Math.floor((completed - first) / (1000 * 60 * 60 * 24));
                        return `${diffDays} days`;
                      })() : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    From first notification to completion
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Response Rate</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {trackingData.viewedAt ? '100%' : '0%'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {trackingData.viewedAt ? 'Task was viewed' : 'Never viewed'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskTrackingDetail;