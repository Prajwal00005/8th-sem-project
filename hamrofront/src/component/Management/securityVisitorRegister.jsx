import React, { useEffect, useState } from "react";
import { useVisitorStore } from "../../store/visitorStore";

const SecurityVisitorRegister = () => {
  const {
    visitors,
    fetchVisitors,
    visitorData,
    setVisitorData,
    handleAddVisitor,
    loading,
    error,
    searchTerm,
    setSearchTerm,
  } = useVisitorStore();

  const [dateFilter, setDateFilter] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  const filteredVisitors = visitors.filter((visitor) => {
    const matchesSearch =
      !searchTerm ||
      (visitor.name &&
        visitor.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (visitor.phone_number &&
        visitor.phone_number.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDate =
      !dateFilter || (visitor.date && visitor.date.startsWith(dateFilter));

    return matchesSearch && matchesDate;
  });

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Register Visitor
          </h2>
          <button
            type="button"
            onClick={() => {
              setVisitorData({
                name: "",
                address: "",
                phone_number: "",
                purpose: "",
                date: "",
                expected_time: "",
              });
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            Add Visitor
          </button>
        </div>

        {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}

        {showModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Add Visitor
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                >
                  ×
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  handleAddVisitor(e);
                  setShowModal(false);
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={visitorData.name}
                    onChange={(e) =>
                      setVisitorData({ ...visitorData, name: e.target.value })
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={visitorData.phone_number}
                    onChange={(e) =>
                      setVisitorData({
                        ...visitorData,
                        phone_number: e.target.value,
                      })
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={visitorData.address}
                    onChange={(e) =>
                      setVisitorData({
                        ...visitorData,
                        address: e.target.value,
                      })
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purpose
                  </label>
                  <input
                    type="text"
                    value={visitorData.purpose}
                    onChange={(e) =>
                      setVisitorData({
                        ...visitorData,
                        purpose: e.target.value,
                      })
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={visitorData.date}
                    onChange={(e) =>
                      setVisitorData({ ...visitorData, date: e.target.value })
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={visitorData.expected_time}
                    onChange={(e) =>
                      setVisitorData({
                        ...visitorData,
                        expected_time: e.target.value,
                      })
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="md:col-span-2 flex justify-end mt-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-60"
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search by name or phone"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Filter by date:</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Name
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Phone
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Address
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Purpose
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Date
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredVisitors.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-4 text-center text-gray-500 text-sm"
                    colSpan={7}
                  >
                    No visitors found.
                  </td>
                </tr>
              ) : (
                filteredVisitors.map((visitor) => (
                  <tr key={visitor.id}>
                    <td className="px-4 py-2 text-gray-800">{visitor.name}</td>
                    <td className="px-4 py-2 text-gray-800">
                      {visitor.phone_number || "-"}
                    </td>
                    <td className="px-4 py-2 text-gray-800">
                      {visitor.address || "-"}
                    </td>
                    <td className="px-4 py-2 text-gray-800">
                      {visitor.purpose}
                    </td>
                    <td className="px-4 py-2 text-gray-800">{visitor.date}</td>
                    <td className="px-4 py-2 text-gray-800">
                      {visitor.expected_time}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SecurityVisitorRegister;
