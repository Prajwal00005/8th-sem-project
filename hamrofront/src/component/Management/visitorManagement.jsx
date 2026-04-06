import React, { useEffect } from 'react';
import { useVisitorStore } from '../../store/visitorStore';
import { UserPlus, X } from 'lucide-react';
import { Input } from '../UI/input';
import { Select } from '../UI/select';
import { Button } from '../UI/button';

const VisitorSection = ({ userRole }) => {
  const {
    isFormVisible,
    visitorData,
    loading,
    error,
    searchTerm,
    historyStatusFilter,
    showHistory,
    setVisitorData,
    setSearchTerm,
    setHistoryStatusFilter,
    fetchVisitors,
    fetchVisitorHistory,
    handleAddVisitor,
    handleVisitorAction,
    toggleFormVisibility,
    toggleShowHistory,
    getFilteredVisitors,
    getFilteredHistory,
  } = useVisitorStore();

  useEffect(() => {
    fetchVisitors();
    fetchVisitorHistory();
  }, [fetchVisitors, fetchVisitorHistory]);

  const filteredVisitors = getFilteredVisitors();
  const filteredHistory = getFilteredHistory();

  const statusStyles = {
    'checked-in': 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    'checked-out': 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header Section */}
      <div className="text-center lg:text-left">
        <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          {showHistory
            ? 'Visitor History'
            : userRole === 'resident'
            ? 'My Visitors'
            : 'Manage Visitors'}
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          {showHistory
            ? 'Review past visitor records'
            : 'Track and manage visitor access'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-800">
              {filteredVisitors.length}
            </span>
          </div>
          <h3 className="text-xs font-semibold text-slate-800">Active Visitors</h3>
          <p className="text-xs text-slate-500 mt-1">Currently registered</p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-800">
              {filteredVisitors.filter(v => v.status === 'checked-in').length}
            </span>
          </div>
          <h3 className="text-xs font-semibold text-slate-800">Checked In</h3>
          <p className="text-xs text-slate-500 mt-1">Currently on premises</p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-800">
              {filteredVisitors.filter(v => v.status === 'pending').length}
            </span>
          </div>
          <h3 className="text-xs font-semibold text-slate-800">Pending</h3>
          <p className="text-xs text-slate-500 mt-1">Awaiting approval</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-start">
        {userRole === 'resident' && !showHistory && (
          <Button
            onClick={toggleFormVisibility}
            icon={UserPlus}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-lg transition-all"
          >
            {isFormVisible ? 'Cancel' : 'Add Visitor'}
          </Button>
        )}
        <Button
          onClick={toggleShowHistory}
          className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-6 py-2.5 rounded-lg font-medium shadow-lg transition-all"
        >
          {showHistory ? 'Show Current Visitors' : 'Show Visitor History'}
        </Button>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search visitors..."
              className="text-base py-3 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400"
            />
          </div>
          {showHistory && (
            <div className="lg:w-64">
              <Select
                value={historyStatusFilter}
                onChange={(e) => {
                  setHistoryStatusFilter(e.target.value);
                  fetchVisitorHistory();
                }}
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'checked-in', label: 'Checked In' },
                  { value: 'checked-out', label: 'Checked Out' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
                className="text-base py-3 bg-white border-slate-200 text-slate-800"
              />
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Visitors Display */}
      {loading && !isFormVisible ? (
        <div className="text-center p-8">
          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div>
          </div>
          <p className="text-slate-500 text-sm">Loading {showHistory ? 'history' : 'visitors'}...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(showHistory ? filteredHistory : filteredVisitors).map((visitor) => (
            <div
              key={visitor.id}
              className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 p-4 hover:shadow-md transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-base font-semibold text-slate-800 truncate">
                  {visitor.name}
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    statusStyles[visitor.status]
                  }`}
                >
                  {visitor.status}
                </span>
              </div>
              <div className="space-y-2 text-slate-600 text-sm">
                <p>
                  <span className="font-medium">Unit:</span> {visitor.unit}
                </p>
                <p>
                  <span className="font-medium">Purpose:</span> {visitor.purpose}
                </p>
                <p>
                  <span className="font-medium">Date:</span> {visitor.date} |{' '}
                  <span className="font-medium">Time:</span>{' '}
                  {visitor.expected_time}
                </p>
                {visitor.check_in_time && (
                  <p>
                    <span className="font-medium">Checked In:</span>{' '}
                    {new Date(visitor.check_in_time).toLocaleString()}
                  </p>
                )}
                {visitor.check_out_time && (
                  <p>
                    <span className="font-medium">Checked Out:</span>{' '}
                    {new Date(visitor.check_out_time).toLocaleString()}
                  </p>
                )}
              </div>
              {userRole === 'security' &&
                !showHistory &&
                (visitor.status === 'pending' || visitor.status === 'checked-in') && (
                  <div className="mt-4 flex gap-2">
                    {visitor.status === 'pending' && (
                      <>
                        <Button
                          onClick={() =>
                            handleVisitorAction(visitor.id, 'checked-in')
                          }
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-3 py-1.5 text-xs rounded-lg font-medium transition-all"
                        >
                          Check In
                        </Button>
                        <Button
                          onClick={() =>
                            handleVisitorAction(visitor.id, 'rejected')
                          }
                          variant="danger"
                          className="px-3 py-1.5 text-xs rounded-lg font-medium"
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {visitor.status === 'checked-in' && (
                      <Button
                        onClick={() =>
                          handleVisitorAction(visitor.id, 'checked-out')
                        }
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3 py-1.5 text-xs rounded-lg font-medium transition-all"
                      >
                        Check Out
                      </Button>
                    )}
                  </div>
                )}
            </div>
          ))}
          {(showHistory ? filteredHistory : filteredVisitors).length === 0 && (
            <div className="col-span-full text-center p-8">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-slate-500 text-sm">No {showHistory ? 'visitor history' : 'visitors'} found</p>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {isFormVisible && userRole === 'resident' && !showHistory && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl max-w-3xl w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold text-slate-800">Register New Visitor</h3>
                <p className="text-sm text-slate-500 mt-1">Fill in visitor details</p>
              </div>
              <Button
                variant="secondary"
                onClick={toggleFormVisibility}
                icon={X}
                className="p-2 hover:bg-slate-100 text-slate-600"
              />
            </div>
            <form
              onSubmit={handleAddVisitor}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <Input
                label="Visitor Name"
                value={visitorData.name}
                onChange={(e) => setVisitorData({ name: e.target.value })}
                required
                className="text-base bg-white border-slate-200 text-slate-800"
              />
              <Input
                label="Purpose"
                value={visitorData.purpose}
                onChange={(e) => setVisitorData({ purpose: e.target.value })}
                required
                className="text-base bg-white border-slate-200 text-slate-800"
              />
              <Input
                label="Date"
                type="date"
                value={visitorData.date}
                onChange={(e) => setVisitorData({ date: e.target.value })}
                required
                className="text-base bg-white border-slate-200 text-slate-800"
              />
              <Input
                label="Expected Time"
                type="time"
                value={visitorData.expected_time}
                onChange={(e) =>
                  setVisitorData({ expected_time: e.target.value })
                }
                required
                className="text-base bg-white border-slate-200 text-slate-800"
              />
              <div className="col-span-full flex justify-end gap-4">
                <Button
                  variant="secondary"
                  onClick={toggleFormVisibility}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 font-medium shadow-lg transition-all"
                >
                  {loading ? 'Registering...' : 'Register Visitor'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorSection;