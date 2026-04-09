import React, { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useSecurityPaymentStore } from "../../store/securityPaymentStore";
import { Alert, AlertDescription } from "../UI/alert";
import { Button } from "../UI/button";
import { X } from "lucide-react";
import SecurityPaymentForm from "../Payments/securityPaymentForm";
import PaymentHistoryPDF from "./paymentHistoryPdf";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const AdminSecurityPayment = () => {
  const {
    securityPayments,
    securityReminder,
    fetchSecurityPayments,
    fetchSecurityReminder,
    securityUsers,
    fetchSecurityUsers,
  } = useSecurityPaymentStore();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [error, setError] = useState("");
  const [showReminder, setShowReminder] = useState(true);
  const [selectedSecurityId, setSelectedSecurityId] = useState("");
  const [salaryMonth, setSalaryMonth] = useState(
    (new Date().getMonth() + 1).toString(),
  );
  const [paymentYear, setPaymentYear] = useState(
    new Date().getFullYear().toString(),
  );

  useEffect(() => {
    fetchSecurityPayments();
    fetchSecurityReminder();
    fetchSecurityUsers();
  }, [fetchSecurityPayments, fetchSecurityReminder, fetchSecurityUsers]);

  const handlePaySecurity = async () => {
    if (!selectedSecurityId) {
      setError("Please select a security user");
      return;
    }
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/v1/createSecurityPaymentIntent/",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            security_id: selectedSecurityId,
            payment_year: parseInt(paymentYear, 10),
            payment_month: parseInt(salaryMonth, 10),
          }),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to create payment intent");
      setClientSecret(data.clientSecret);
      setPaymentDetails(data.payment);
      setShowPaymentForm(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClosePaymentForm = (success) => {
    setShowPaymentForm(false);
    setClientSecret("");
    setPaymentDetails(null);
    if (success) {
      fetchSecurityPayments();
    }
  };

  const columns = [
    {
      label: "Date",
      key: "created_at",
      render: (row) => {
        const dt = row.created_at ? new Date(row.created_at) : null;
        const baseDate = dt ? dt.toLocaleDateString() : "-";
        const month = row.payment_month;
        const year = row.payment_year;
        if (month && year) {
          return `${baseDate} (${String(month).padStart(2, "0")}/${year})`;
        }
        return baseDate;
      },
    },
    { label: "Security", key: "security_username" },
    { label: "Amount", key: "amount", render: (row) => `₹${row.amount}` },
    {
      label: "Month/Year",
      key: "payment_period",
      render: (row) =>
        row.payment_month && row.payment_year
          ? `${String(row.payment_month).padStart(2, "0")}/${row.payment_year}`
          : row.payment_year || "-",
    },
    {
      label: "Status",
      key: "status",
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            row.status === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      label: "End Date",
      key: "payment_end_date",
      render: (row) =>
        row.payment_end_date
          ? new Date(row.payment_end_date).toLocaleDateString()
          : "N/A",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-[#2C3B2A]">
            Security Payment
          </h2>
          <p className="text-[#5C7361] mt-1">
            Manage salary payments for security personnel
          </p>
        </div>
        <Button
          onClick={handlePaySecurity}
          className="bg-[#395917] hover:bg-[#2C3B2A] text-white px-6 py-3 rounded-lg"
          disabled={!selectedSecurityId}
        >
          Pay Security
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          variant="error"
          className="mb-6 rounded-xl bg-red-50 text-red-900"
        >
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Reminder Section */}
      {(() => {
        const list = Array.isArray(securityReminder)
          ? securityReminder
          : securityReminder
            ? [securityReminder]
            : [];
        const first = list.find(
          (r) =>
            r &&
            r.reminder &&
            r.reminder !== "No security payments due within the next 7 days.",
        );
        if (!showReminder || !first) return null;
        return (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
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
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    {first.reminder}
                  </p>
                  {first.due_date && first.days_until_due != null && (
                    <p className="text-xs text-orange-600">
                      Due: {first.due_date} ({first.days_until_due} days left)
                    </p>
                  )}
                  {typeof first.amount_due === "number" &&
                    first.amount_due > 0 && (
                      <p className="text-xs text-orange-700 mt-1">
                        Amount due: ₹{first.amount_due.toFixed(2)}
                      </p>
                    )}
                </div>
              </div>
              <button
                onClick={() => setShowReminder(false)}
                className="p-1.5 hover:bg-orange-100 text-orange-600 rounded transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        );
      })()}

      {/* Search and Payment Form */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Select Security User
          </label>
          <select
            value={selectedSecurityId}
            onChange={(e) => {
              const user = securityUsers.find(
                (u) => u.id === parseInt(e.target.value),
              );
              setSelectedSecurityId(user.id);
            }}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
          >
            <option value="">Select a security user...</option>
            {securityUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username} - {user.email}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Salary Month
            </label>
            <select
              value={salaryMonth}
              onChange={(e) => setSalaryMonth(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            >
              {[
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ].map((m, index) => (
                <option key={m} value={index + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Salary Year
            </label>
            <input
              type="number"
              value={paymentYear}
              onChange={(e) => setPaymentYear(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Security Payment Details and History */}
      {!showPaymentForm && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-[#2C3B2A] mb-6">
            Security Payment Details
          </h3>
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="p-3 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    Payment History
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    All security salary payment records
                  </p>
                </div>
                <PaymentHistoryPDF
                  title="Security Payment History"
                  data={securityPayments}
                  columns={columns}
                  filename="admin_security_payment_history"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">
                      Security User
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">
                      Amount
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">
                      Payment Year
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">
                      End Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {securityPayments.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-4 py-8 text-center text-slate-500 text-sm"
                      >
                        No payment history available.
                      </td>
                    </tr>
                  ) : (
                    securityPayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="hover:bg-[#F5F8F6] transition-colors"
                      >
                        <td className="px-8 py-5 text-base text-[#2C3B2A]">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-8 py-5 text-base text-[#2C3B2A]">
                          {payment.security_username}
                        </td>
                        <td className="px-8 py-5 text-base text-[#2C3B2A]">
                          ₹{payment.amount}
                        </td>
                        <td className="px-8 py-5 text-base text-[#2C3B2A]">
                          {payment.payment_year}
                        </td>
                        <td className="px-8 py-5 text-base">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payment.status === "success"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-base text-[#2C3B2A]">
                          {payment.payment_end_date
                            ? new Date(
                                payment.payment_end_date,
                              ).toLocaleDateString()
                            : "N/A"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
            <SecurityPaymentForm
              paymentDetails={paymentDetails}
              onClose={handleClosePaymentForm}
              clientSecret={clientSecret}
            />
          </Elements>
        </div>
      )}
    </div>
  );
};

export default AdminSecurityPayment;
