import React, { useEffect, useState } from "react";
import { useSecurityBillStore } from "../../store/securityBillStore";

const SecurityBillManagement = () => {
  const {
    rooms,
    bills,
    loading,
    error,
    billForm,
    setBillForm,
    addItemRow,
    updateItemRow,
    removeItemRow,
    fetchRooms,
    fetchBills,
    saveBill,
    startEditBill,
    deleteBill,
    resetBillForm,
    editingBill,
  } = useSecurityBillStore();

  const [showModal, setShowModal] = useState(false);
  const [viewBill, setViewBill] = useState(null);
  const [searchRoom, setSearchRoom] = useState("");
  const [searchName, setSearchName] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchRooms();
    fetchBills();
  }, [fetchRooms, fetchBills]);

  const handleOpenCreate = () => {
    resetBillForm();
    setShowModal(true);
  };

  const handleEdit = (bill) => {
    startEditBill(bill);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const ok = await saveBill();
    if (ok) setShowModal(false);
  };

  const computeTotal = () => {
    return billForm.items.reduce((sum, i) => {
      const val = parseFloat(i.amount);
      return !isNaN(val) ? sum + val : sum;
    }, 0);
  };

  const filteredBills = bills.filter((bill) => {
    const roomMatch = bill.room_number
      ?.toString()
      .toLowerCase()
      .includes(searchRoom.toLowerCase());
    const nameMatch = bill.resident_name
      ?.toString()
      .toLowerCase()
      .includes(searchName.toLowerCase());

    const statusMatch =
      statusFilter === "all" || bill.payment_status === statusFilter;
    return roomMatch && nameMatch && statusMatch;
  });

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Bill Management
          </h2>
          <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-end gap-2">
            <input
              type="text"
              placeholder="Search by room"
              value={searchRoom}
              onChange={(e) => setSearchRoom(e.target.value)}
              className="w-full md:w-40 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Search by name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full md:w-48 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-40 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              Create Bill
            </button>
          </div>
        </div>

        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

        {/* Bills table */}
        <div className="overflow-x-auto border rounded-lg mb-6">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Room
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Resident
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Date
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Total Amount
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Status
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredBills.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-4 text-center text-gray-500 text-sm"
                    colSpan={5}
                  >
                    No bills found.
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill.id}>
                    <td className="px-4 py-2 text-gray-800">
                      {bill.room_number}
                    </td>
                    <td className="px-4 py-2 text-gray-800">
                      {bill.resident_name}
                    </td>
                    <td className="px-4 py-2 text-gray-800">{bill.date}</td>
                    <td className="px-4 py-2 text-gray-800">
                      ₹{bill.total_amount}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${bill.payment_status === "paid" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {bill.payment_status === "paid" ? "Paid" : "Unpaid"}
                      </span>
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setViewBill(bill)}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(bill)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Delete this bill?"))
                            deleteBill(bill.id);
                        }}
                        className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* View bill modal */}
        {viewBill && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Bill Details
                </h3>
                <button
                  type="button"
                  onClick={() => setViewBill(null)}
                  className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                >
                  ×
                </button>
              </div>
              <div className="mb-4 text-sm text-gray-700 space-y-1">
                <p>
                  <span className="font-medium">Room:</span>{" "}
                  {viewBill.room_number}
                </p>
                <p>
                  <span className="font-medium">Resident:</span>{" "}
                  {viewBill.resident_name}
                </p>
                <p>
                  <span className="font-medium">Date:</span> {viewBill.date}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${viewBill.payment_status === "paid" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {viewBill.payment_status === "paid" ? "Paid" : "Unpaid"}
                  </span>
                </p>
              </div>
              <div className="overflow-x-auto border rounded-lg mb-4">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">
                        S.N.
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">
                        Bill Name
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">
                        Units
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">
                        Rate / Unit
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {viewBill.items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="px-4 py-2 text-gray-800">{idx + 1}</td>
                        <td className="px-4 py-2 text-gray-800">{item.name}</td>
                        <td className="px-4 py-2 text-gray-800">
                          {item.units ?? "-"}
                        </td>
                        <td className="px-4 py-2 text-gray-800">
                          {item.rate_per_unit ?? "-"}
                        </td>
                        <td className="px-4 py-2 text-gray-800">
                          ₹{item.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-right font-semibold text-gray-900">
                Total: ₹{viewBill.total_amount}
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit bill modal */}
        {showModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingBill ? "Edit Bill" : "Create Bill"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room
                    </label>
                    <select
                      value={billForm.room}
                      onChange={(e) => setBillForm({ room: e.target.value })}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select room</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.room_number}
                          {room.resident_name ? ` - ${room.resident_name}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={billForm.date}
                      onChange={(e) => setBillForm({ date: e.target.value })}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Status
                    </label>
                    <select
                      value={billForm.payment_status}
                      onChange={(e) =>
                        setBillForm({ payment_status: e.target.value })
                      }
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="unpaid">Unpaid</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">
                          Bill Name
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">
                          Units (optional)
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">
                          Rate / Unit (optional)
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">
                          Amount
                        </th>
                        <th className="px-4 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {billForm.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) =>
                                updateItemRow(idx, { name: e.target.value })
                              }
                              className="w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Electricity, Water, ..."
                              required
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.units}
                              onChange={(e) =>
                                updateItemRow(idx, { units: e.target.value })
                              }
                              className="w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Units"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.rate_per_unit}
                              onChange={(e) =>
                                updateItemRow(idx, {
                                  rate_per_unit: e.target.value,
                                })
                              }
                              className="w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Rate per unit"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.amount}
                              onChange={(e) =>
                                updateItemRow(idx, { amount: e.target.value })
                              }
                              className="w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Amount"
                              required
                            />
                          </td>
                          <td className="px-4 py-2 text-right">
                            {billForm.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItemRow(idx)}
                                className="text-xs text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add another item
                  </button>
                  <div className="text-sm font-semibold text-gray-900">
                    Total: ₹{computeTotal().toFixed(2)}
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
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
                    {loading
                      ? "Saving..."
                      : editingBill
                        ? "Update Bill"
                        : "Save Bill"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityBillManagement;
