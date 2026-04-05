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
    <div className="p-8 bg-[#F5F8F6]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-[#2C3B2A]">
              Subscription Payment
            </h2>
            <p className="text-[#5C7361] mt-1">
              Manage your annual subscription.
            </p>
          </div>
          {!hasActiveSubscription && (
            <Button
              onClick={handlePaySubscription}
              className="bg-[#395917] hover:bg-[#2C3B2A] text-white px-6 py-3 rounded-lg"
              disabled={!subscriptionPrice || subscriptionPrice <= 0}
            >
              Pay Subscription
            </Button>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="error" className="mb-6 rounded-xl">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Reminder Section */}
        {showReminder &&
          subscriptionReminder &&
          subscriptionReminder.reminder !==
            "No subscription payments due within the next 7 days." && (
            <div className="bg-white border border-[#E8EFEA] rounded-xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#2C3B2A]">
                  {subscriptionReminder.reminder}
                </p>
                <p className="text-xs text-[#5C7361]">
                  Due: {subscriptionReminder.due_date} (
                  {subscriptionReminder.days_until_due} days left)
                </p>
              </div>
              <Button
                onClick={() => setShowReminder(false)}
                variant="secondary"
                icon={X}
                className="p-2 hover:bg-[#E8EFEA]"
              />
            </div>
          )}

        {/* Subscription Details and Payment History */}
        {!showPaymentForm && (
          <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] overflow-hidden">
            <div className="px-8 py-6">
              <h3 className="text-xl font-semibold text-[#2C3B2A] mb-4">
                Subscription Details
              </h3>
              <p className="text-base text-[#5C7361] mb-4">
                Yearly Subscription Price: ₹{subscriptionPrice}
              </p>
              {hasActiveSubscription ? (
                <div className="mb-4">
                  <p className="text-base font-medium text-[#395917]">
                    Your subscription for {currentYear} is active.
                  </p>
                  {subscriptionPayments.find(
                    (p) =>
                      p.subscription_year === currentYear &&
                      p.status === "active",
                  )?.subscription_end_date && (
                    <p className="text-sm text-[#10bb35]">
                      Valid until:{" "}
                      {new Date(
                        subscriptionPayments.find(
                          (p) =>
                            p.subscription_year === currentYear &&
                            p.status === "active",
                        ).subscription_end_date,
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <Button
                  onClick={handlePaySubscription}
                  className="bg-[#395917] hover:bg-[#2C3B2A] text-white px-6 py-2.5 rounded-lg"
                  disabled={!subscriptionPrice || subscriptionPrice <= 0}
                >
                  Pay Subscription
                </Button>
              )}
            </div>

            <div className="border-t border-[#E8EFEA]">
              <div className="flex justify-between items-center px-8 py-4 bg-[#E8EFEA] text-[#2C3B2A]">
                <h3 className="text-xl font-semibold">Payment History</h3>
                <PaymentHistoryPDF
                  title="Subscription Payment History"
                  data={subscriptionPayments}
                  columns={columns}
                  filename="admin_subscription_payment_history"
                />
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
    </div>
  );
};

export default AdminSubscriptionPayment;
