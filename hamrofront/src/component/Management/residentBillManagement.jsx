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
      alert("Bill payment successful!");
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

  const filteredBills = bills.filter((bill) => {
    if (statusFilter === "all") return true;
    return bill.payment_status === statusFilter;
  });

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Bill Management
          </h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-40 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>

        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Room
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
                    No bills yet.
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill.id}>
                    <td className="px-4 py-2 text-gray-800">
                      {bill.room_number}
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
                <h3 className="text-lg font-semibold text-gray-800">
                  Bill Details
                </h3>
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
                  <span className="font-medium">Room:</span>{" "}
                  {selectedBill.room_number}
                </p>
                <p>
                  <span className="font-medium">Date:</span> {selectedBill.date}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${selectedBill.payment_status === "paid" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {selectedBill.payment_status === "paid" ? "Paid" : "Unpaid"}
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
                    {selectedBill.items.map((item, idx) => (
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
                Total: ₹{selectedBill.total_amount}
              </div>
              {selectedBill.payment_status === "unpaid" && (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => openBillPaymentForm(selectedBill)}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                  >
                    Pay with Card
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {showPaymentForm && clientSecret && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <BillPaymentForm onClose={closeBillPaymentForm} />
            </Elements>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResidentBillManagement;
