import React, { useEffect, useState } from 'react';
import { useResidentBillStore } from '../../store/residentBillStore';

const ResidentBillManagement = () => {
  const { bills, selectedBill, fetchBills, fetchBillDetail, clearSelectedBill, loading, error } =
    useResidentBillStore();
  const [viewBillId, setViewBillId] = useState(null);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  useEffect(() => {
    if (viewBillId != null) {
      fetchBillDetail(viewBillId);
    }
  }, [viewBillId, fetchBillDetail]);

  const handleView = (billId) => {
    setViewBillId(billId);
  };

  const closeModal = () => {
    setViewBillId(null);
    clearSelectedBill();
  };

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Bill Management</h2>

        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Room</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Date</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Total Amount</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {bills.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-4 text-center text-gray-500 text-sm"
                    colSpan={4}
                  >
                    No bills yet.
                  </td>
                </tr>
              ) : (
                bills.map((bill) => (
                  <tr key={bill.id}>
                    <td className="px-4 py-2 text-gray-800">{bill.room_number}</td>
                    <td className="px-4 py-2 text-gray-800">{bill.date}</td>
                    <td className="px-4 py-2 text-gray-800">₹{bill.total_amount}</td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => handleView(bill.id)}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selectedBill && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Bill Details</h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                >
                  ×
                </button>
              </div>
              <div className="mb-4 text-sm text-gray-700 space-y-1">
                <p>
                  <span className="font-medium">Room:</span> {selectedBill.room_number}
                </p>
                <p>
                  <span className="font-medium">Date:</span> {selectedBill.date}
                </p>
              </div>
              <div className="overflow-x-auto border rounded-lg mb-4">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">S.N.</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Bill Name</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Units</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Rate / Unit</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {selectedBill.items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="px-4 py-2 text-gray-800">{idx + 1}</td>
                        <td className="px-4 py-2 text-gray-800">{item.name}</td>
                        <td className="px-4 py-2 text-gray-800">{item.units ?? '-'}</td>
                        <td className="px-4 py-2 text-gray-800">{item.rate_per_unit ?? '-'}</td>
                        <td className="px-4 py-2 text-gray-800">₹{item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-right font-semibold text-gray-900">
                Total: ₹{selectedBill.total_amount}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResidentBillManagement;
