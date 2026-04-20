import React, { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Alert, AlertDescription } from "../UI/alert";
import { Button } from "../UI/button";
import { X } from "lucide-react";
import { useResidentBillStore } from "../../store/residentBillStore";
import { toast } from "react-toastify";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const BillPaymentForm = ({ onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { loading, error, confirmBillPayment, payingBill } =
    useResidentBillStore();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/resident-dashboard?bill_payment=success`,
      },
      redirect: "if_required",
    });

    if (paymentError) {
      console.error("Stripe payment error", paymentError);
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      await confirmBillPayment(paymentIntent.id);
      toast.success("Bill payment successful!");
      onClose();
    }
  };

  if (!payingBill) return null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Pay Bill</h3>
        <Button variant="secondary" onClick={onClose} className="p-2">
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="mb-4 space-y-1 text-sm text-gray-700">
        <p>
          <span className="font-medium">Room:</span> {payingBill.room_number}
        </p>
        <p>
          <span className="font-medium">Date:</span> {payingBill.date}
        </p>
        <p>
          <span className="font-medium">Total Amount:</span> ₹
          {payingBill.total_amount}
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <PaymentElement />
        <div className="flex justify-end gap-3 mt-4">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            className="px-4 py-2"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!stripe || loading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
          >
            {loading ? "Processing..." : "Pay Now"}
          </Button>
        </div>
      </form>
    </div>
  );
};

const ResidentBillManagement = () => {
  const {
    bills,
    billsPagination,
    billsStats,
    selectedBill,
    fetchBills,
    fetchBillDetail,
    clearSelectedBill,
    loading,
    error,
    showPaymentForm,
    clientSecret,
    openBillPaymentForm,
    closeBillPaymentForm,
  } = useResidentBillStore();
  const [viewBillId, setViewBillId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchBills({
      page,
      page_size: pageSize,
      status: statusFilter === "all" ? "" : statusFilter,
    });
  }, [fetchBills, page, pageSize, statusFilter]);

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

  const totalBills =
    billsStats?.total ?? billsPagination?.total ?? bills.length;
  const paidBills =
    billsStats?.paid ?? bills.filter((b) => b.payment_status === "paid").length;
  const unpaidBills =
    billsStats?.unpaid ??
    bills.filter((b) => b.payment_status === "unpaid").length;
  const filteredTotal = billsPagination?.total ?? bills.length;

  return (
    <div className="space-y-4 p-4">
      {/* Header Section */}
      <div className="text-center lg:text-left">
        <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          Bill Management
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          View and pay your utility bills
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-800">
              {totalBills}
            </span>
          </div>
          <h3 className="text-xs font-semibold text-slate-800">Total Bills</h3>
          <p className="text-xs text-slate-500 mt-1">All time records</p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-800">
              {paidBills}
            </span>
          </div>
          <h3 className="text-xs font-semibold text-slate-800">Paid Bills</h3>
          <p className="text-xs text-slate-500 mt-1">Successfully paid</p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-800">
              {unpaidBills}
            </span>
          </div>
          <h3 className="text-xs font-semibold text-slate-800">Unpaid Bills</h3>
          <p className="text-xs text-slate-500 mt-1">Pending payment</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Filter Bills
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Filter by payment status
            </p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-white border border-slate-200 text-slate-800 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {/* Bills Table */}
      <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-white/50">
          <h3 className="text-lg font-semibold text-slate-800">Your Bills</h3>
          <p className="text-xs text-slate-500 mt-1">
            {filteredTotal} bill{filteredTotal !== 1 ? "s" : ""} found
          </p>
        </div>

        {bills.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-slate-500 text-sm">No bills found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-white/50">
                    <th className="px-6 py-3 text-left font-medium text-slate-700 text-sm">
                      Room
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-slate-700 text-sm">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-slate-700 text-sm">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-slate-700 text-sm">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-slate-700 text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bills.map((bill) => (
                    <tr
                      key={bill.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-slate-800">
                        {bill.room_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {bill.date}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">
                        ₹{bill.total_amount}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            bill.payment_status === "paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {bill.payment_status === "paid" ? "Paid" : "Unpaid"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleView(bill.id)}
                          className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {billsPagination && (
              <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-white/50 bg-gradient-to-r from-slate-50 to-gray-50">
                <label className="text-sm text-slate-600">Page size</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value, 10));
                    setPage(1);
                  }}
                  className="bg-white border border-slate-200 text-slate-800 px-2 py-1 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!billsPagination.has_previous || loading}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-sm text-slate-600">
                  Page {billsPagination.page} /{" "}
                  {Math.max(1, billsPagination.total_pages)}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!billsPagination.has_next || loading}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bill Details Modal */}
      {selectedBill && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl w-full max-w-2xl mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-slate-800">
                  Bill Details
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  View detailed bill information
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Room Number</span>
                <span className="text-sm font-medium text-slate-800">
                  {selectedBill.room_number}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Date</span>
                <span className="text-sm font-medium text-slate-800">
                  {selectedBill.date}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Status</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedBill.payment_status === "paid"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {selectedBill.payment_status === "paid" ? "Paid" : "Unpaid"}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-800 mb-3">
                Bill Items
              </h4>
              <div className="bg-slate-50 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <th className="px-4 py-2 text-left font-medium text-slate-700 text-xs">
                          S.N.
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-slate-700 text-xs">
                          Bill Name
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-slate-700 text-xs">
                          Units
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-slate-700 text-xs">
                          Rate / Unit
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-slate-700 text-xs">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedBill.items.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50">
                          <td className="px-4 py-2 text-sm text-slate-800">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-2 text-sm text-slate-800">
                            {item.name}
                          </td>
                          <td className="px-4 py-2 text-sm text-slate-600">
                            {item.units ?? "-"}
                          </td>
                          <td className="px-4 py-2 text-sm text-slate-600">
                            {item.rate_per_unit ?? "-"}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium text-slate-800">
                            ₹{item.amount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center pt-4 border-t border-slate-200">
                <span className="text-lg font-semibold text-slate-800">
                  Total Amount
                </span>
                <span className="text-xl font-bold text-slate-800">
                  ₹{selectedBill.total_amount}
                </span>
              </div>
            </div>

            {selectedBill.payment_status === "unpaid" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => openBillPaymentForm(selectedBill)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium shadow-lg transition-all"
                >
                  Pay Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && clientSecret && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <BillPaymentForm onClose={closeBillPaymentForm} />
          </Elements>
        </div>
      )}
    </div>
  );
};

export default ResidentBillManagement;
