import React, { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useSecurityPaymentStore } from '../../store/securityPaymentStore';
import { Alert, AlertDescription } from '../UI/alert';
import { Button } from '../UI/button';
import { X } from 'lucide-react';
import SecurityPaymentForm from '../Payments/securityPaymentForm';
import PaymentHistoryPDF from './paymentHistoryPdf';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const AdminSecurityPayment = () => {
    const { 
        securityPayments, 
        securityReminder, 
        fetchSecurityPayments, 
        fetchSecurityReminder,
        securityUsers,
        fetchSecurityUsers
    } = useSecurityPaymentStore();
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [clientSecret, setClientSecret] = useState('');
    const [paymentDetails, setPaymentDetails] = useState(null);
    const [error, setError] = useState('');
    const [showReminder, setShowReminder] = useState(true);
    const [selectedSecurityId, setSelectedSecurityId] = useState('');

    useEffect(() => {
        fetchSecurityPayments();
        fetchSecurityReminder();
        fetchSecurityUsers();
    }, [fetchSecurityPayments, fetchSecurityReminder, fetchSecurityUsers]);

    const handlePaySecurity = async () => {
        if (!selectedSecurityId) {
            setError('Please select a security user');
            return;
        }
        try {
            const response = await fetch('http://127.0.0.1:8000/api/v1/createSecurityPaymentIntent/', {
                method: 'POST',
                headers: {
                    Authorization: `Token ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ security_id: selectedSecurityId })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to create payment intent');
            setClientSecret(data.clientSecret);
            setPaymentDetails(data.payment);
            setShowPaymentForm(true);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleClosePaymentForm = (success) => {
        setShowPaymentForm(false);
        setClientSecret('');
        setPaymentDetails(null);
        if (success) {
            fetchSecurityPayments();
        }
    };

    const columns = [
        { label: 'Date', key: 'created_at', render: (row) => new Date(row.created_at).toLocaleDateString() },
        { label: 'Security', key: 'security_username' },
        { label: 'Amount', key: 'amount', render: (row) => `₹${row.amount}` },
        { label: 'Payment Year', key: 'payment_year' },
        { label: 'Status', key: 'status', render: (row) => (
          <span className={`px-2 py-1 rounded-full text-xs ${
            row.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>{row.status}</span>
        )},
        { label: 'End Date', key: 'payment_end_date', render: (row) => (
          row.payment_end_date ? new Date(row.payment_end_date).toLocaleDateString() : 'N/A'
        )},
      ];

    return (
        <div className="space-y-6">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-semibold text-[#2C3B2A]">Security Payment</h2>
                        <p className="text-[#5C7361] mt-1">Manage salary payments for security personnel</p>
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
                    <Alert variant="error" className="mb-6 rounded-xl bg-red-50 text-red-900">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Reminder Section */}
                {showReminder && securityReminder && securityReminder.some(reminder => reminder.reminder !== 'No security payments due within the next 7 days.') && (
                    <div className="bg-white border border-[#E8EFEA] rounded-xl p-6 shadow-sm space-y-4">
                        {securityReminder.map((reminder, index) => (
                            reminder.reminder !== 'No security payments due within the next 7 days.' && (
                                <div key={index} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-[#2C3B2A]">{reminder.reminder}</p>
                                        <p className="text-xs text-[#5C7361]">
                                            Due: {reminder.due_date} ({reminder.days_until_due} days left)
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => setShowReminder(false)}
                                        variant="secondary"
                                        icon={X}
                                        className="p-2 hover:bg-[#E8EFEA]"
                                    />
                                </div>
                            )
                        ))}
                    </div>
                )}

                {/* Security Payment Details and History */}
                {!showPaymentForm && (
                    <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-8">
                        <h3 className="text-xl font-semibold text-[#2C3B2A] mb-6">Security Payment Details</h3>
                        <div className="mb-6">
                            <label className="block text-sm text-[#5C7361] mb-2">Select Security User</label>
                            <select
                                value={selectedSecurityId}
                                onChange={(e) => setSelectedSecurityId(e.target.value)}
                                className="w-full text-base px-4 py-3 border border-[#E8EFEA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#395917] transition-colors bg-white"
                            >
                                <option value="">Select a security user</option>
                                {securityUsers.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.username} (₹{user.salary})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="border-t border-[#E8EFEA] pt-6">
                            <div className="flex justify-between items-center px-8 py-4 bg-[#E8EFEA] text-[#2C3B2A]">
                                <h3 className="text-xl font-semibold">Payment History</h3>
                                <PaymentHistoryPDF
                                    title="Security Payment History"
                                    data={securityPayments}
                                    columns={columns}
                                    filename="security_payment_history"
                                />
                            </div>
                            {securityPayments.length === 0 ? (
                                <p className="text-[#5C7361] px-8 py-8">No payment history available.</p>
                            ) : (
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-[#F5F8F6] text-[#2C3B2A]">
                                            <th className="px-8 py-4 text-left font-medium text-base">Date</th>
                                            <th className="px-8 py-4 text-left font-medium text-base">Security</th>
                                            <th className="px-8 py-4 text-left font-medium text-base">Amount</th>
                                            <th className="px-8 py-4 text-left font-medium text-base">Payment Year</th>
                                            <th className="px-8 py-4 text-left font-medium text-base">Status</th>
                                            <th className="px-8 py-4 text-left font-medium text-base">End Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E8EFEA]">
                                        {securityPayments.map((payment) => (
                                            <tr key={payment.id} className="hover:bg-[#F5F8F6] transition-colors">
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
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        payment.status === 'success' ? 'bg-green-100 text-green-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {payment.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-base text-[#2C3B2A]">
                                                    {payment.payment_end_date ? new Date(payment.payment_end_date).toLocaleDateString() : 'N/A'}
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
                        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#395917' } }}}>
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