import React, { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useAdminDashboardStore } from "../../store/adminDashboardStore";
import { Alert, AlertDescription } from "../UI/alert";
import { Button } from "../UI/button";
import { X } from "lucide-react";
import SubscriptionPaymentForm from "../Payments/subscriptionPaymentForm";
import PaymentHistoryPDF from "./paymentHistoryPdf";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const AdminSubscriptionPayment = () => {
  const {
    subscriptionPayments,
    subscriptionPrice,
    subscriptionReminder,
    fetchSubscriptionPayments,
    fetchProfile,
    fetchSubscriptionReminder,
  } = useAdminDashboardStore();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [error, setError] = useState("");
  const [showReminder, setShowReminder] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchSubscriptionPayments();
    fetchSubscriptionReminder();
  }, [fetchProfile, fetchSubscriptionPayments, fetchSubscriptionReminder]);

  const currentYear = new Date().getFullYear();
  const hasActiveSubscription = subscriptionPayments.some(
    (payment) =>
      payment.subscription_year === currentYear && payment.status === "active",
  );

  const handlePaySubscription = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/v1/createAdminSubscriptionIntent/",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
      );
      const data = await response.json();
      console.log("createAdminSubscriptionIntent response:", data);
      if (!response.ok)
        throw new Error(data.error || "Failed to create payment intent");
      setClientSecret(data.clientSecret);
      setPaymentDetails(data.payment);
      setShowPaymentForm(true);
    } catch (err) {
      console.error("Error:", err.message);
      setError(err.message);
    }
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "extended":
        return "bg-yellow-100 text-yellow-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const columns = [
    {
      label: "Date",
      key: "created_at",
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
    { label: "Amount", key: "amount", render: (row) => `₹${row.amount}` },
    { label: "Subscription Year", key: "subscription_year" },
    {
      label: "Status",
      key: "status_display",
      render: (row) => {
        const status = row.status_display || row.status;
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs ${getStatusClasses(status)}`}
          >
            {status}
          </span>
        );
      },
    },
    {
      label: "End Date",
      key: "subscription_end_date",
      render: (row) =>
        row.subscription_end_date
          ? new Date(row.subscription_end_date).toLocaleDateString()
          : "N/A",
    },
  ];

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          Subscription Payment
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Manage your annual subscription.
        </p>
      </div>

      {/* Status Card */}
      <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              hasActiveSubscription 
                ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                : 'bg-gradient-to-br from-orange-500 to-red-600'
            }`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Subscription Status
              </h3>
              <p className="text-xs text-slate-500">
                {hasActiveSubscription ? `Active for ${currentYear}` : 'Not Active'}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Yearly Price: ₹{subscriptionPrice}
              </p>
            </div>
          </div>
          {!hasActiveSubscription && (
            <Button
              onClick={handlePaySubscription}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-md transition-all duration-200"
              disabled={!subscriptionPrice || subscriptionPrice <= 0}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pay Subscription
            </Button>
          )}
        </div>
      </div>

      {/* Reminder Alert */}
      {showReminder &&
        subscriptionReminder &&
        subscriptionReminder.reminder !==
          "No subscription payments due within the next 7 days." && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    {subscriptionReminder.reminder}
                  </p>
                  <p className="text-xs text-orange-600">
                    Due: {subscriptionReminder.due_date} ({subscriptionReminder.days_until_due} days left)
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowReminder(false)}
                variant="secondary"
                icon={X}
                className="p-1.5 hover:bg-orange-100 text-orange-600"
              />
            </div>
          </div>
        )}

      {/* Payment History */}
      {!showPaymentForm && (
        <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 overflow-hidden">
          <div className="p-3 border-b border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Payment History</h3>
                <p className="text-xs text-slate-500 mt-1">All subscription payment records</p>
              </div>
              <PaymentHistoryPDF
                title="Subscription Payment History"
                data={subscriptionPayments}
                columns={columns}
                filename="admin_subscription_payment_history"
              />
            </div>
          </div>
            {subscriptionPayments.length === 0 ? (
              <p className="text-[#5C7361] px-8 py-8">
                No payment history available.
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F5F8F6] text-[#2C3B2A]">
                    <th className="px-8 py-4 text-left font-medium text-base">
                      Date
                    </th>
                    <th className="px-8 py-4 text-left font-medium text-base">
                      Amount
                    </th>
                    <th className="px-8 py-4 text-left font-medium text-base">
                      Subscription Year
                    </th>
                    <th className="px-8 py-4 text-left font-medium text-base">
                      Status
                    </th>
                    <th className="px-8 py-4 text-left font-medium text-base">
                      End Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EFEA]">
                  {subscriptionPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="hover:bg-[#F5F8F6] transition-colors"
                    >
                      <td className="px-8 py-5 text-base text-[#2C3B2A]">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-5 text-base text-[#2C3B2A]">
                        ₹{payment.amount}
                      </td>
                      <td className="px-8 py-5 text-base text-[#2C3B2A]">
                        {payment.subscription_year}
                      </td>
                      <td className="px-8 py-5 text-base">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            payment.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-base text-[#2C3B2A]">
                        {payment.subscription_end_date
                          ? new Date(
                              payment.subscription_end_date,
                            ).toLocaleDateString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
                variables: { colorPrimary: "#395917" },
              },
            }}
          >
            <SubscriptionPaymentForm
              paymentDetails={paymentDetails}
              onClose={() => {
                setShowPaymentForm(false);
                fetchSubscriptionPayments();
              }}
              clientSecret={clientSecret}
            />
          </Elements>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionPayment;
