import React, { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Alert, AlertDescription } from "../UI/alert";
import { useRentPaymentStore } from "../../store/rentPaymentStore";
import { Button } from "../UI/button";
import { Input } from "../UI/input";
import { X } from "lucide-react";
import { toast } from "react-toastify";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const RentPaymentForm = ({ paymentDetails, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { loading, error, setLoading, setError, confirmPayment } =
    useRentPaymentStore();

  console.log("Payment Details in Form:", paymentDetails);
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (!stripe || !elements) {
      setError("Payment processing is not ready.");
      setLoading(false);
      return;
    }

    const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/resident-dashboard?payment=success`,
      },
      redirect: "if_required",
    });

    if (paymentError) {
      setError(paymentError.message || "Payment failed.");
      setLoading(false);
    } else if (paymentIntent.status === "succeeded") {
      await confirmPayment(paymentIntent.id);
      toast.success("Payment successful! Invoice downloaded.");
      onClose();
    } else {
      setError("Payment was canceled or failed.");
      await confirmPayment(paymentIntent.id);
      onClose();
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full mx-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-[#2C3B2A]">
          Complete Payment
        </h3>
        <Button
          variant="secondary"
          onClick={onClose}
          icon={X}
          className="p-2 hover:bg-[#E8EFEA]"
        />
      </div>
      <div className="mb-6 space-y-2 text-[#5C7361]">
        <p>Resident: {paymentDetails.resident_name}</p>
        <p>Room: {paymentDetails.room_number}</p>
        <p>
          Period: {paymentDetails.period_from} to {paymentDetails.period_to}
        </p>
        <p>Total Amount: ₹{paymentDetails.total_amount}</p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <PaymentElement />
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            className="px-6 py-2.5"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!stripe || loading}
            className="bg-[#395917] hover:bg-[#2C3B2A] text-white px-6 py-2.5"
          >
            {loading ? "Processing..." : "Pay Now"}
          </Button>
        </div>
      </form>
    </div>
  );
};

const RentPayment = () => {
  const {
    showPaymentForm,
    clientSecret,
    loading,
    error,
    paymentDetails,
    paymentHistory,
    monthlyRent,
    setShowPaymentForm,
    setPaymentDetails,
    fetchRoomDetails,
    fetchPaymentHistory,
    handleSubmit,
    updatePeriodTo,
    setError,
    checkRentIncrease,
    previousRent,
    paymentReminder,
    fetchPaymentReminder,
    lastRentIncreaseDate,
    rentIncreased,
    showPaymentReminder,
    hidePaymentReminder,
    showRentIncreaseReminder,
    hideRentIncreaseReminder,
    rentIncreaseReminder,
    currentDetails,
  } = useRentPaymentStore();
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      await checkRentIncrease();
      await fetchRoomDetails();
      await fetchPaymentHistory();
      await fetchPaymentReminder();
    };
    fetchData();

    if (
      paymentReminder &&
      paymentReminder.reminder !== "No payment due at this time."
    ) {
      setShowReminder(true);
    }
  }, []);

  const downloadPDF = async () => {
    try {
      const filteredIds = paymentHistory.map((payment) => payment.id);
      const response = await fetch(
        "http://127.0.0.1:8000/api/v1/generatePaymentHistoryPDF/",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ payment_ids: filteredIds }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "payment_history.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF Download Error:", err);
      setError("Failed to download PDF. Please try again.");
    }
  };

  const handlePeriodFromChange = (e) => {
    const newFrom = e.target.value;
    setPaymentDetails({
      ...currentDetails,
      period_from: newFrom,
      period_to: "",
    });
    if (newFrom) {
      const fromDate = new Date(newFrom);
      if (!isNaN(fromDate.getTime())) {
        updatePeriodTo();
      } else {
        setError("Invalid start date.");
      }
    } else {
      setError("Please select a start date.");
    }
  };

  const handlePeriodToChange = (e) => {
    const newTo = e.target.value;
    const { paymentDetails } = useRentPaymentStore.getState();
    if (!paymentDetails.period_from) {
      setError("Please select a start date first.");
      setPaymentDetails({ period_to: "" });
      return;
    }
    const fromDate = new Date(paymentDetails.period_from);
    if (isNaN(fromDate.getTime())) {
      setError("Invalid start date.");
      setPaymentDetails({ period_to: "" });
      return;
    }
    if (!newTo) {
      setError("Please select an end date.");
      setPaymentDetails({ period_to: "" });
      return;
    }
    const toDate = new Date(newTo);
    if (isNaN(toDate.getTime())) {
      setError("Invalid end date.");
      setPaymentDetails({ period_to: "" });
      return;
    }
    const daysCovered =
      Math.round((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
    if (daysCovered <= 0) {
      setError("End date must be after start date.");
      setPaymentDetails({ period_to: "" });
      return;
    }

    if (daysCovered % 30 !== 0) {
      const monthsCovered = Math.max(1, Math.round(daysCovered / 30));
      const suggestedTo = new Date(fromDate);
      suggestedTo.setDate(suggestedTo.getDate() + (monthsCovered * 30 - 1));
      setPaymentDetails({ period_to: suggestedTo.toISOString().split("T")[0] });
      setError(
        `Please pick a date that’s a full ${monthsCovered * 30} days from ${paymentDetails.period_from} (e.g., ${suggestedTo.toISOString().split("T")[0]}).`,
      );
    } else {
      setPaymentDetails({ ...currentDetails, period_to: newTo });
      setError("");
    }
  };

  const monthsCovered =
    paymentDetails.period_from && paymentDetails.period_to
      ? Math.max(
          1,
          Math.round(
            (new Date(paymentDetails.period_to) -
              new Date(paymentDetails.period_from)) /
              (1000 * 60 * 60 * 24 * 30),
          ),
        )
      : 1;
  const totalAmount = monthlyRent * monthsCovered;

  const fillPeriodFromReminderOrHistory = () => {
    let fromDate = null;
    let toDate = null;

    // 1) If backend already tells us a due_date, use that as period_to
    if (paymentReminder && paymentReminder.due_date) {
      const due = new Date(paymentReminder.due_date);
      if (!isNaN(due.getTime())) {
        toDate = due;
        const start = new Date(due);
        start.setDate(start.getDate() - 29);
        fromDate = start;
      }
    }

    // 2) Fallback: if we have history but no reminder date, start after last period
    if ((!fromDate || !toDate) && paymentHistory && paymentHistory.length > 0) {
      const latest = paymentHistory.reduce((latest, current) => {
        if (!latest) return current;
        const latestDate = new Date(latest.period_to || latest.created_at);
        const currentDate = new Date(current.period_to || current.created_at);
        return currentDate > latestDate ? current : latest;
      }, null);

      if (latest?.period_to) {
        const start = new Date(latest.period_to);
        start.setDate(start.getDate() + 1);
        const end = new Date(start);
        end.setDate(end.getDate() + 29);
        fromDate = start;
        toDate = end;
      }
    }

    if (!fromDate || !toDate) return;

    const fromStr = fromDate.toISOString().split("T")[0];
    const toStr = toDate.toISOString().split("T")[0];

    setPaymentDetails({
      ...currentDetails,
      period_from: fromStr,
      period_to: toStr,
    });
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header Section */}
      <div className="text-center lg:text-left">
        <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          Rent Payment
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Manage and track your rent payments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-800">
              ₹{monthlyRent}
            </span>
          </div>
          <h3 className="text-xs font-semibold text-slate-800">Monthly Rent</h3>
          <p className="text-xs text-slate-500 mt-1">Current amount</p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-800">
              {paymentHistory.filter(p => p.status === 'paid' || p.status === 'advance').length}
            </span>
          </div>
          <h3 className="text-xs font-semibold text-slate-800">Payments Made</h3>
          <p className="text-xs text-slate-500 mt-1">Total completed</p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-800">
              {paymentReminder && paymentReminder.reminder !== "No payment due at this time." ? paymentReminder.days_until_due : 'N/A'}
            </span>
          </div>
          <h3 className="text-xs font-semibold text-slate-800">Days Until Due</h3>
          <p className="text-xs text-slate-500 mt-1">Next payment</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center lg:justify-start">
        <Button
          onClick={() => {
            fillPeriodFromReminderOrHistory();
            setShowPaymentForm(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Make Payment
        </Button>
      </div>

      {/* Reminder Alert */}
      {showReminder &&
        showPaymentReminder &&
        paymentReminder &&
        paymentReminder.reminder !== "No payment due at this time." && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    {paymentReminder.reminder}
                  </p>
                  <p className="text-xs text-amber-600">
                    Due: {paymentReminder.due_date} ({paymentReminder.days_until_due} days left)
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setShowReminder(false);
                  hidePaymentReminder();
                }}
                variant="secondary"
                icon={X}
                className="p-2 hover:bg-amber-100 text-amber-600"
              />
            </div>
          </div>
        )}

      {/* Rent Increase Alert */}
      {showRentIncreaseReminder && rentIncreaseReminder && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">
                  {rentIncreaseReminder}
                </p>
                <p className="text-xs text-blue-600">
                  {rentIncreased && previousRent
                    ? `From ₹${previousRent.toFixed(2)} to ₹${monthlyRent.toFixed(2)}`
                    : `Current rent: ₹${monthlyRent.toFixed(2)}`}
                  {lastRentIncreaseDate &&
                    ` (Last checked on ${new Date(lastRentIncreaseDate).toLocaleDateString()})`}
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                hideRentIncreaseReminder();
              }}
              variant="secondary"
              icon={X}
              className="p-2 hover:bg-blue-100 text-blue-600"
            />
          </div>
        </div>
      )}

      {/* Payment History Table */}
      <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-white/50">
          <h3 className="text-lg font-semibold text-slate-800">Payment History</h3>
          <Button
            onClick={downloadPDF}
            variant="secondary"
            className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md"
          >
            Download PDF
          </Button>
        </div>
        {paymentHistory.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm">No payment history available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-white/50">
                  <th className="px-6 py-3 text-left font-medium text-slate-700 text-sm">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-slate-700 text-sm">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-slate-700 text-sm">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-slate-700 text-sm">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentHistory.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-slate-800">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {payment.period_from} to {payment.period_to}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                      ₹{payment.amount}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === "advance"
                            ? "bg-blue-100 text-blue-800"
                            : payment.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-slate-800 font-medium">Processing Payment...</span>
          </div>
        </div>
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && clientSecret && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: { colorPrimary: "#3b82f6" },
              },
            }}
          >
            <RentPaymentForm
              paymentDetails={{
                ...paymentDetails,
                total_amount: totalAmount,
              }}
              monthlyRent={monthlyRent}
              onClose={() => setShowPaymentForm(false)}
            />
          </Elements>
        </div>
      )}

      {/* Initial Payment Details Form */}
      {showPaymentForm && !clientSecret && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-slate-800">
                Enter Payment Details
              </h3>
              <Button
                variant="secondary"
                onClick={() => setShowPaymentForm(false)}
                icon={X}
                className="p-2 hover:bg-slate-100 text-slate-600"
              />
            </div>

            {error && (
              <Alert variant="error" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {monthlyRent === 0 ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div>
                </div>
                <p className="text-slate-500 text-sm">Loading room details...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Resident Name"
                  value={paymentDetails.resident_name}
                  className="bg-slate-50 border-slate-200 text-slate-800"
                  disabled
                />
                <Input
                  label="Room Number"
                  value={paymentDetails.room_number}
                  className="bg-slate-50 border-slate-200 text-slate-800"
                  disabled
                />
                <Input
                  label="Period From"
                  type="date"
                  value={paymentDetails.period_from}
                  onChange={handlePeriodFromChange}
                  required
                  className="border-slate-200 text-slate-800"
                />
                <Input
                  label="Period To"
                  type="date"
                  value={paymentDetails.period_to}
                  onChange={handlePeriodToChange}
                  required
                  className="border-slate-200 text-slate-800"
                />
                <Input
                  label="Total Amount"
                  type="number"
                  value={totalAmount}
                  className="bg-slate-50 border-slate-200 text-slate-800"
                  disabled
                />
                <div className="flex gap-4 justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => setShowPaymentForm(false)}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      loading ||
                      !paymentDetails.period_from ||
                      !paymentDetails.period_to
                    }
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 font-medium shadow-lg"
                  >
                    {loading ? "Processing..." : "Proceed to Payment"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RentPayment;
