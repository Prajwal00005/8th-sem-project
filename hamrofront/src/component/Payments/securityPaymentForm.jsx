import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Alert, AlertDescription } from '../UI/alert';

const SecurityPaymentForm = ({ paymentDetails, onClose, clientSecret }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        if (!stripe || !elements) {
            setError('Payment processing is not ready.');
            setLoading(false);
            return;
        }

        const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/security-dashboard?security_payment=success`,
            },
            redirect: 'if_required',
        });

        if (paymentError) {
            setError(paymentError.message || 'Payment failed.');
            setLoading(false);
        } else if (paymentIntent.status === 'succeeded') {
            try {
                const response = await fetch('http://127.0.0.1:8000/api/v1/confirmSecurityPayment/', {
                    method: 'POST',
                    headers: {
                        Authorization: `Token ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        payment_intent_id: paymentIntent.id
                    })
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to confirm payment');
                }
                alert('Security payment successful!');
                onClose(true);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        } else {
            setError('Payment was canceled or failed.');
            setLoading(false);
        }
    };

    const handleCancel = () => {
        onClose(false);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Complete Security Payment</h2>
            <div className="mb-4 space-y-2">
                <p>Amount: ₹{paymentDetails.amount}</p>
                <p>Payment Year: {paymentDetails.payment_year}</p>
            </div>
            
            {error && (
                <Alert variant="error" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <PaymentElement />
                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={!stripe || loading}
                        className="flex-1 bg-[#395917] text-white py-2 px-4 rounded hover:bg-[#2C3B2A] disabled:bg-gray-400"
                    >
                        {loading ? 'Processing...' : 'Pay Now'}
                    </button>
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={loading}
                        className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SecurityPaymentForm;