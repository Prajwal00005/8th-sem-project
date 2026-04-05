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
    <div className="p-8 bg-[#F5F8F6]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-[#2C3B2A]">
              {showHistory
                ? 'Visitor History'
                : userRole === 'resident'
                ? 'My Visitors'
                : 'Manage Visitors'}
            </h2>
            <p className="text-[#5C7361] mt-1">
              {showHistory
                ? 'Review past visitor records'
                : 'Track and manage visitor access'}
            </p>
          </div>
          <div className="flex gap-3">
            {userRole === 'resident' && !showHistory && (
              <Button
                onClick={toggleFormVisibility}
                icon={UserPlus}
                className="bg-[#395917] hover:bg-[#2C3B2A] text-white px-6 py-3 rounded-lg"
              >
                {isFormVisible ? 'Cancel' : 'Add Visitor'}
              </Button>
            )}
            <Button
              onClick={toggleShowHistory}
              className="bg-[#395917] hover:bg-[#2C3B2A] text-white px-6 py-3 rounded-lg"
            >
              {showHistory ? 'Show Current Visitors' : 'Show Visitor History'}
            </Button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-[#E8EFEA]">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-grow">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search visitors..."
                className="text-base py-3"
              />
            </div>
            {showHistory && (
              <div className="md:w-64">
                <Select
                  value={historyStatusFilter}
                  onChange={(e) => {
                    setHistoryStatusFilter(e.target.value);
                    fetchVisitorHistory();
                  }}
                  options={[
                    { value: '', label: 'All' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'checked-in', label: 'Checked In' },
                    { value: 'checked-out', label: 'Checked Out' },
                    { value: 'rejected', label: 'Rejected' },
                  ]}
                  className="text-base py-3"
                />
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-xl">
            {error}
          </div>
        )}

        {/* Visitors Display */}
        {loading && !isFormVisible ? (
          <div className="text-center p-8 text-[#5C7361] text-lg">
            Loading {showHistory ? 'history' : 'visitors'}...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(showHistory ? filteredHistory : filteredVisitors).map((visitor) => (
              <div
                key={visitor.id}
                className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-6 hover:shadow-md transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-[#2C3B2A] truncate">
                    {visitor.name}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      statusStyles[visitor.status]
                    }`}
                  >
                    {visitor.status}
                  </span>
                </div>
                <div className="space-y-2 text-[#5C7361] text-sm">
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
                    <div className="mt-4 flex gap-3">
                      {visitor.status === 'pending' && (
                        <>
                          <Button
                            onClick={() =>
                              handleVisitorAction(visitor.id, 'checked-in')
                            }
                            className="bg-[#395917] hover:bg-[#2C3B2A] text-white px-4 py-2 text-sm rounded-lg"
                          >
                            Check In
                          </Button>
                          <Button
                            onClick={() =>
                              handleVisitorAction(visitor.id, 'rejected')
                            }
                            variant="danger"
                            className="px-4 py-2 text-sm rounded-lg"
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
                          className="bg-[#395917] hover:bg-[#2C3B2A] text-white px-4 py-2 text-sm rounded-lg"
                        >
                          Check Out
                        </Button>
                      )}
                    </div>
                  )}
              </div>
            ))}
            {(showHistory ? filteredHistory : filteredVisitors).length === 0 && (
              <div className="col-span-full text-center p-8 text-[#5C7361] text-lg">
                No {showHistory ? 'visitor history' : 'visitors'} found
              </div>
            )}
          </div>
        )}

        {/* Form Modal */}
        {isFormVisible && userRole === 'resident' && !showHistory && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-[#2C3B2A]">
                  Register New Visitor
                </h3>
                <Button
                  variant="secondary"
                  onClick={toggleFormVisibility}
                  icon={X}
                  className="p-2 hover:bg-[#E8EFEA]"
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
                  className="text-base"
                />
                <Input
                  label="Purpose"
                  value={visitorData.purpose}
                  onChange={(e) => setVisitorData({ purpose: e.target.value })}
                  required
                  className="text-base"
                />
                <Input
                  label="Date"
                  type="date"
                  value={visitorData.date}
                  onChange={(e) => setVisitorData({ date: e.target.value })}
                  required
                  className="text-base"
                />
                <Input
                  label="Expected Time"
                  type="time"
                  value={visitorData.expected_time}
                  onChange={(e) =>
                    setVisitorData({ expected_time: e.target.value })
                  }
                  required
                  className="text-base"
                />
                <div className="col-span-full flex justify-end gap-4">
                  <Button
                    variant="secondary"
                    onClick={toggleFormVisibility}
                    className="px-6 py-2.5"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-[#395917] hover:bg-[#2C3B2A] text-white px-6 py-2.5"
                  >
                    {loading ? 'Registering...' : 'Register Visitor'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitorSection;