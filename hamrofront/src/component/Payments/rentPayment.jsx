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
    <div className="p-8 bg-[#F5F8F6]">
      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-xl shadow-lg flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#395917]"></div>
            <span className="text-[#2C3B2A]">Processing Payment...</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-[#2C3B2A]">
              Rent Payment
            </h2>
            <p className="text-[#5C7361] mt-1">
              Manage and track your rent payments
            </p>
          </div>
          <Button
            onClick={() => {
              fillPeriodFromReminderOrHistory();
              setShowPaymentForm(true);
            }}
            className="bg-[#395917] hover:bg-[#2C3B2A] text-white px-6 py-3 rounded-lg"
          >
            Make Payment
          </Button>
        </div>

        {/* Reminder Section */}

        {showReminder &&
          showPaymentReminder &&
          paymentReminder &&
          paymentReminder.reminder !== "No payment due at this time." && (
            <div className="bg-white border border-[#E8EFEA] rounded-xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#2C3B2A]">
                  {paymentReminder.reminder}
                </p>
                <p className="text-xs text-[#5C7361]">
                  Due: {paymentReminder.due_date} (
                  {paymentReminder.days_until_due} days left)
                </p>
              </div>
              <Button
                onClick={() => {
                  setShowReminder(false);
                  hidePaymentReminder();
                }}
                variant="secondary"
                icon={X}
                className="p-2 hover:bg-[#E8EFEA]"
              />
            </div>
          )}

        {showRentIncreaseReminder && rentIncreaseReminder && (
          <div className="bg-white border border-[#E8EFEA] rounded-xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#2C3B2A]">
                {rentIncreaseReminder}
              </p>
              <p className="text-xs text-[#5C7361]">
                {rentIncreased && previousRent
                  ? `From ₹${previousRent.toFixed(2)} to ₹${monthlyRent.toFixed(2)}`
                  : `Current rent: ₹${monthlyRent.toFixed(2)}`}
                {lastRentIncreaseDate &&
                  ` (Last checked on ${new Date(lastRentIncreaseDate).toLocaleDateString()})`}
              </p>
            </div>
            <Button
              onClick={() => {
                hideRentIncreaseReminder();
              }}
              variant="secondary"
              icon={X}
              className="p-2 hover:bg-[#E8EFEA]"
            />
          </div>
        )}

        {/* Payment History Section */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] overflow-hidden">
          <div className="flex justify-between items-center px-8 py-4 bg-[#E8EFEA] text-[#2C3B2A]">
            <h3 className="text-xl font-semibold">Payment History</h3>
            <Button
              onClick={downloadPDF}
              variant="secondary"
              className="bg-transparent border border-[#2C3B2A] text-[#2C3B2A] hover:bg-[#21330e] hover:text-white px-4 py-2 rounded-lg"
            >
              Download PDF
            </Button>
          </div>
          {paymentHistory.length === 0 ? (
            <p className="text-[#5C7361] p-8">No payment history available.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-[#F5F8F6] text-[#2C3B2A]">
                  <th className="px-8 py-4 text-left font-medium text-base">
                    Date
                  </th>
                  <th className="px-8 py-4 text-left font-medium text-base">
                    Period
                  </th>
                  <th className="px-8 py-4 text-left font-medium text-base">
                    Amount
                  </th>
                  <th className="px-8 py-4 text-left font-medium text-base">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EFEA]">
                {paymentHistory.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-[#F5F8F6] transition-colors"
                  >
                    <td className="px-8 py-5 text-base text-[#2C3B2A]">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-5 text-base text-[#5C7361]">
                      {payment.period_from} to {payment.period_to}
                    </td>
                    <td className="px-8 py-5 text-base text-[#2C3B2A]">
                      ₹{payment.amount}
                    </td>
                    <td className="px-8 py-5 text-base">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
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
          )}
        </div>

        {/* Payment Form Modal */}
        {showPaymentForm && clientSecret && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: { colorPrimary: "#395917" },
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
            <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-[#2C3B2A]">
                  Enter Payment Details
                </h3>
                <Button
                  variant="secondary"
                  onClick={() => setShowPaymentForm(false)}
                  icon={X}
                  className="p-2 hover:bg-[#E8EFEA]"
                />
              </div>

              {error && (
                <Alert variant="error" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {monthlyRent === 0 ? (
                <p className="text-[#5C7361]">Loading room details...</p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <Input
                    label="Resident Name"
                    value={paymentDetails.resident_name}
                    className="bg-gray-100"
                    disabled
                  />
                  <Input
                    label="Room Number"
                    value={paymentDetails.room_number}
                    className="bg-gray-100"
                    disabled
                  />
                  <Input
                    label="Period From"
                    type="date"
                    value={paymentDetails.period_from}
                    onChange={handlePeriodFromChange}
                    required
                  />
                  <Input
                    label="Period To"
                    type="date"
                    value={paymentDetails.period_to}
                    onChange={handlePeriodToChange}
                    required
                  />
                  <Input
                    label="Total Amount"
                    type="number"
                    value={totalAmount}
                    className="bg-gray-100"
                    disabled
                  />
                  <div className="flex gap-4 justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => setShowPaymentForm(false)}
                      className="px-6 py-2.5"
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
                      className="bg-[#395917] hover:bg-[#2C3B2A] text-white px-6 py-2.5"
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
    </div>
  );
};

export default RentPayment;
