import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GoalsForm = ({ goal, onSubmit, onCancel, mode = 'create' }) => {
  const navigate = useNavigate();
  
  // Form state
  const [goalTitle, setGoalTitle] = useState('');
  const [targetDeadline, setTargetDeadline] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [milestones, setMilestones] = useState([]);

  // Load goal data if editing
  useEffect(() => {
    if (goal && mode === 'edit') {
      setGoalTitle(goal.title || '');
      setTargetDeadline(goal.targetDate || '');
      setCategory(goal.category || '');
      setDescription(goal.description || '');
      setMilestones(goal.milestones || []);
    }
  }, [goal, mode]);

  // Quick Start Templates
  const templates = [
    {
      id: 1,
      icon: '💼',
      title: 'Professional Development',
      subtitle: 'Career growth goals',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      textColor: 'text-blue-600',
      category: 'Work'
    },
    {
      id: 2,
      icon: '💪',
      title: 'Health & Fitness',
      subtitle: 'Wellness objectives',
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-100',
      textColor: 'text-green-600',
      category: 'Health'
    },
    {
      id: 3,
      icon: '💰',
      title: 'Financial Goals',
      subtitle: 'Savings and investments',
      bgColor: 'bg-yellow-50',
      iconBg: 'bg-yellow-100',
      textColor: 'text-yellow-600',
      category: 'Financial'
    },
    {
      id: 4,
      icon: '📚',
      title: 'Learning & Education',
      subtitle: 'Knowledge acquisition',
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      textColor: 'text-purple-600',
      category: 'Education'
    }
  ];

  // Smart Features
  const smartFeatures = [
    {
      id: 1,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'Get AI Suggestions',
      subtitle: 'Smart milestone recommendations',
      iconBg: 'bg-indigo-100',
      textColor: 'text-indigo-600'
    },
    {
      id: 2,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      title: 'Similar Goals',
      subtitle: 'View related setup goals',
      iconBg: 'bg-teal-100',
      textColor: 'text-teal-600'
    }
  ];

  const categories = [
    { value: '', label: 'Select category' },
    { value: 'Work', label: 'Professional Development' },
    { value: 'Health', label: 'Health & Fitness' },
    { value: 'Financial', label: 'Financial' },
    { value: 'Education', label: 'Learning & Education' },
    { value: 'Personal', label: 'Personal Growth' },
    { value: 'Relationships', label: 'Relationships' },
    { value: 'Creative', label: 'Creative Projects' },
    { value: 'Other', label: 'Other' }
  ];

  const handleAddMilestone = () => {
    const newMilestone = {
      id: Date.now(),
      title: '',
      completed: false
    };
    setMilestones([...milestones, newMilestone]);
  };

  const handleMilestoneChange = (id, value) => {
    setMilestones(milestones.map(m => 
      m.id === id ? { ...m, title: value } : m
    ));
  };

  const handleRemoveMilestone = (id) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const handleTemplateClick = (template) => {
    setCategory(template.category);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const goalData = {
      title: goalTitle,
      targetDate: targetDeadline,
      category: category,
      description: description,
      milestones: milestones,
      progress: goal?.progress || 0,
      targetValue: goal?.targetValue || 100,
      currentValue: goal?.currentValue || 0,
      unit: goal?.unit || '',
    };

    onSubmit(goalData);
  };

  const handleGoBack = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/goals');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={handleGoBack}
          className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Back to Goals</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form - Left Side */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  {mode === 'edit' ? 'Edit Goal' : 'Create New Goal'}
                </h1>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <span>Goals</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>{mode === 'edit' ? 'Edit Goal' : 'Create New Goal'}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Essential Details Section */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Essential Details</h2>

                  {/* Goal Title */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Goal Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={goalTitle}
                      onChange={(e) => setGoalTitle(e.target.value)}
                      placeholder="e.g., Complete AWS certification, Run a marathon, Write a book"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Target Deadline */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Deadline <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={targetDeadline}
                      onChange={(e) => setTargetDeadline(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">When do you want to achieve this goal?</p>
                  </div>

                  {/* Category */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Optional Details Section */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Optional Details</h2>

                  {/* Description */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your goal and why it matters to you..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Milestones */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Milestones
                      </label>
                      <button
                        type="button"
                        onClick={handleAddMilestone}
                        className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Milestone
                      </button>
                    </div>

                    {milestones.length > 0 && (
                      <div className="space-y-2">
                        {milestones.map((milestone) => (
                          <div key={milestone.id} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={milestone.title}
                              onChange={(e) => handleMilestoneChange(milestone.id, e.target.value)}
                              placeholder="Enter milestone"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveMilestone(milestone.id)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {milestones.length === 0 && (
                      <p className="text-sm text-gray-500 italic">No milestones added yet</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  >
                    {mode === 'edit' ? 'Update Goal' : 'Create Goal'}
                  </button>
                  <button
                    type="button"
                    onClick={handleGoBack}
                    className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Start Templates */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Start Templates</h3>
              <div className="space-y-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateClick(template)}
                    className={`w-full ${template.bgColor} hover:shadow-md transition-shadow rounded-lg p-4 text-left group`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`${template.iconBg} rounded-lg p-2 text-2xl group-hover:scale-110 transition-transform`}>
                        {template.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold ${template.textColor} text-sm mb-0.5`}>
                          {template.title}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {template.subtitle}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Smart Features */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Smart Features</h3>
              <div className="space-y-3">
                {smartFeatures.map((feature) => (
                  <button
                    key={feature.id}
                    type="button"
                    className="w-full hover:bg-gray-50 transition-colors rounded-lg p-3 text-left group border border-gray-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`${feature.iconBg} rounded-lg p-2 ${feature.textColor} group-hover:scale-110 transition-transform`}>
                        {feature.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm mb-0.5">
                          {feature.title}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {feature.subtitle}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalsForm;