// src/components/tracking/GoalTrackingDetail.jsx
import React, { useState } from 'react';
import { 
  FiBell, FiTarget, FiTrendingUp, FiZap, 
  FiCheckCircle, FiCalendar, FiBarChart2,
  FiPieChart, FiActivity
} from 'react-icons/fi';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, 
  Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

const GoalTrackingDetail = ({ goal, trackingData, onClose }) => {
  // Removed unused timeRange state variable
  const [chartType, setChartType] = useState('area');

  if (!trackingData) {
    return (
      <div className="bg-white rounded-xl p-6">
        <div className="text-center py-8">
          <FiTarget className="text-4xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tracking Data</h3>
          <p className="text-gray-600 mb-4">
            No notification tracking data available for this goal yet.
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
    progressUpdates: trackingData.progressUpdates || [],
    confirmationCount: trackingData.confirmationTimes?.length || 0,
    notificationTypes: trackingData.notificationTypes || {}
  };

  // Prepare progress chart data
  const prepareProgressData = () => {
    if (!stats.progressUpdates.length) return [];
    
    const data = [];
    
    stats.progressUpdates.forEach((update, index) => {
      const date = new Date(update.timestamp);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: update.timestamp.split('T')[0],
        progress: update.newProgress,
        change: update.newProgress - update.oldProgress,
        updateNumber: index + 1
      });
    });
    
    return data;
  };

  const progressData = prepareProgressData();
  const notificationTypeData = Object.entries(stats.notificationTypes).map(([type, count]) => ({
    name: type.replace('_', ' ').toUpperCase(),
    value: count,
    color: type === 'reminder' ? '#3B82F6' : 
           type === 'snooze' ? '#F59E0B' : 
           type === 'progress_update' ? '#8B5CF6' : 
           type === 'completion' ? '#10B981' : '#6B7280'
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

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FiTarget className="text-2xl text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Goal Tracking Analytics</h2>
              <p className="text-gray-600">{goal?.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  goal?.priority === 'high' ? 'bg-red-100 text-red-800' :
                  goal?.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {goal?.priority} priority
                </span>
                <span className="text-xs text-gray-500">
                  {goal?.progress}% complete
                </span>
              </div>
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
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Goal Progress</p>
                <p className="text-2xl font-bold text-purple-800 mt-1">{goal?.progress}%</p>
                <p className="text-xs text-purple-600 mt-1">
                  {stats.progressUpdates.length} updates
                </p>
              </div>
              <FiTrendingUp className="text-purple-500 text-xl" />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Notifications</p>
                <p className="text-2xl font-bold text-blue-800 mt-1">{stats.totalNotifications}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {Object.values(stats.notificationTypes).reduce((a, b) => a + b, 0)} total
                </p>
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
                <p className="text-sm text-green-600 font-medium">Check-ins</p>
                <p className="text-2xl font-bold text-green-800 mt-1">{stats.progressUpdates.length}</p>
                <p className="text-xs text-green-600 mt-1">
                  Last: {stats.progressUpdates.length > 0 ? 
                    formatTime(stats.progressUpdates[stats.progressUpdates.length - 1].timestamp) : 
                    'Never'}
                </p>
              </div>
              <FiCheckCircle className="text-green-500 text-xl" />
            </div>
          </div>
        </div>

        {/* Progress Tracking Chart */}
        {progressData.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Progress Timeline</h3>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="area">Area Chart</option>
                <option value="line">Line Chart</option>
                <option value="bar">Bar Chart</option>
              </select>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' ? (
                  <AreaChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="updateNumber" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [`${value}%`, 'Progress']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="progress" 
                      stroke="#8B5CF6" 
                      fill="#8B5CF6" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                ) : chartType === 'line' ? (
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="updateNumber" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [`${value}%`, 'Progress']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="progress" 
                      stroke="#8B5CF6" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="updateNumber" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [`${value}%`, 'Progress']}
                    />
                    <Bar 
                      dataKey="progress" 
                      fill="#8B5CF6" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 text-center">
              <div>
                <p className="text-sm text-gray-500">Start Progress</p>
                <p className="text-lg font-bold text-gray-900">
                  {progressData.length > 0 ? `${progressData[0].progress}%` : '0%'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Progress</p>
                <p className="text-lg font-bold text-gray-900">
                  {progressData.length > 0 ? `${progressData[progressData.length - 1].progress}%` : '0%'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Improvement</p>
                <p className="text-lg font-bold text-gray-900">
                  {progressData.length > 1 ? 
                    `${progressData[progressData.length - 1].progress - progressData[0].progress}%` : 
                    '0%'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notification Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notification Types Pie Chart */}
          {notificationTypeData.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 h-64">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Notification Distribution</h4>
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
                  <Tooltip formatter={(value) => [value, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Snooze Analysis */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Snooze Analysis</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Snooze Frequency</span>
                  <span className="font-medium">
                    {stats.totalNotifications > 0 ? 
                      (stats.snoozedCount / stats.totalNotifications * 100).toFixed(1) + '%' : 
                      '0%'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-amber-500 h-2 rounded-full"
                    style={{ 
                      width: `${stats.totalNotifications > 0 ? 
                        (stats.snoozedCount / stats.totalNotifications * 100) : 0}%` 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.snoozedCount} of {stats.totalNotifications} notifications were snoozed
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Response Rate</span>
                  <span className="font-medium">
                    {stats.progressUpdates.length > 0 ? 'Good' : 'Needs improvement'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ 
                      width: `${Math.min(100, stats.progressUpdates.length * 20)}%` 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.progressUpdates.length} progress updates recorded
                </p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500">Avg Time Between Updates</p>
                  <p className="font-bold text-gray-900">
                    {stats.progressUpdates.length > 1 ? 
                      `${Math.floor(
                        (new Date(stats.progressUpdates[stats.progressUpdates.length - 1].timestamp) - 
                         new Date(stats.progressUpdates[0].timestamp)) / 
                        (1000 * 60 * 60 * 24 * (stats.progressUpdates.length - 1))
                      )} days` : 
                      'N/A'}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500">Progress Consistency</p>
                  <p className="font-bold text-gray-900">
                    {stats.progressUpdates.length > 1 ? 
                      `${Math.floor(
                        stats.progressUpdates.reduce((sum, update) => sum + Math.abs(update.newProgress - update.oldProgress), 0) / 
                        (stats.progressUpdates.length - 1)
                      )}% avg change` : 
                      'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity Timeline</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {[
              ...(stats.progressUpdates || []).map(update => ({
                ...update,
                type: 'progress_update',
                label: 'Progress Update'
              })),
              ...(trackingData.notificationHistory || []).slice(0, 10)
            ]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 15)
            .map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
                <div className={`mt-1 w-3 h-3 rounded-full ${
                  item.type === 'progress_update' ? 'bg-purple-500' :
                  item.notificationType === 'completion' ? 'bg-green-500' :
                  item.notificationType === 'snooze' ? 'bg-amber-500' :
                  item.notificationType === 'reminder' ? 'bg-blue-500' :
                  'bg-gray-500'
                }`} />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {item.type === 'progress_update' ? 'Progress Update' : 
                       item.notificationType?.replace('_', ' ') || 'Activity'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>
                  {item.type === 'progress_update' ? (
                    <p className="text-xs text-gray-600 mt-1">
                      Progress changed from {item.oldProgress}% to {item.newProgress}% 
                      ({item.newProgress - item.oldProgress > 0 ? '+' : ''}{item.newProgress - item.oldProgress}%)
                    </p>
                  ) : (
                    <p className="text-xs text-gray-600 mt-1">
                      {item.metadata?.snoozeCount && `Snooze #${item.metadata.snoozeCount} • `}
                      {item.metadata?.oldProgress !== undefined && 
                       `Progress: ${item.metadata.oldProgress}% → ${item.metadata.newProgress}%`}
                    </p>
                  )}
                </div>
              </div>
            ))}
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
            onClick={() => {
              // Generate and download report
              const report = {
                goal: goal,
                tracking: stats,
                generatedAt: new Date().toISOString()
              };
              const dataStr = JSON.stringify(report, null, 2);
              const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
              const exportFileDefaultName = `goal-tracking-${goal.id}-${new Date().toISOString().split('T')[0]}.json`;
              const linkElement = document.createElement('a');
              linkElement.setAttribute('href', dataUri);
              linkElement.setAttribute('download', exportFileDefaultName);
              linkElement.click();
            }}
            className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalTrackingDetail;