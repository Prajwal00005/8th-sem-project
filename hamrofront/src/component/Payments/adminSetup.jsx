import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStripeSetupStore } from '../../store/adminStripeSetupStore';
import { Alert, AlertDescription } from '../UI/alert';
import { useSearchParams } from 'react-router-dom';

const AdminStripeSetup = () => {
  const { 
    loading, 
    error, 
    isConnected, 
    searchTerm,
    setSearchTerm,
    checkStripeStatus, 
    handleStripeConnect,
    getFilteredHistory
  } = useAdminStripeSetupStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const setupComplete = searchParams.get('setup_complete') === 'true';
    const returnToDashboard = localStorage.getItem('returnToDashboard') === 'true';
    
    if (setupComplete || returnToDashboard) {
      checkStripeStatus().then(() => {
        if (useAdminStripeSetupStore.getState().isConnected) {
          const role = localStorage.getItem('role');
          if (role === 'admin') {
            navigate('/admin-dashboard');
          } else {
            console.error('Invalid role for AdminStripeSetup:', role);
            navigate('/login');
          }
          localStorage.removeItem('returnToDashboard');
        }
      });
    } else {
      checkStripeStatus();
    }
  }, [checkStripeStatus, navigate]);


  const downloadPDF = async () => {
    try {
      const filteredIds = filteredHistory.map(payment => payment.id);
      const response = await fetch('http://127.0.0.1:8000/api/v1/generatePaymentHistoryPDF/', {
        method: 'POST',
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payment_ids: filteredIds }),
      });
      if (!response.ok) throw new Error('Failed to generate PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'payment_history.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF Download Error:', err);
      useAdminStripeSetupStore.getState().setError('Failed to download PDF. Please try again.');
    }
  };

  const filteredHistory = getFilteredHistory();

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="error" className="mb-4 bg-red-50 text-red-900 rounded-xl">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-[#2C3B2A]">Payment Settings</h2>
          <p className="text-[#5C7361] mt-1">Manage your payment gateway and view transaction history</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-8">
          {isConnected ? (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#E8EFEA] flex items-center justify-center">
                  <div className="w-6 h-6 text-[#395917]">✓</div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[#2C3B2A]">Payment Gateway Status</h3>
                  <p className="text-[#5C7361]">Active and ready to process payments</p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm border border-[#E8EFEA] mb-6">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="flex-grow">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by resident name or room number..."
                      className="w-full px-4 py-3 border border-[#E8EFEA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#395917]/20"
                    />
                  </div>
                  <button
                    onClick={downloadPDF}
                    className="bg-[#395917] hover:bg-[#2C3B2A] text-white px-6 py-3 rounded-lg transition duration-200 whitespace-nowrap"
                  >
                    Download PDF
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] overflow-hidden">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#395917]"></div>
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="text-center py-8 text-[#5C7361]">No payment history available.</div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#2C3B2A] text-white">
                        <th className="px-8 py-4 text-left font-medium text-base">
                          <div className="flex items-center gap-2">
                            Resident
                            <span className="text-white/50">|</span>
                          </div>
                        </th>
                        <th className="px-8 py-4 text-left font-medium text-base">
                          <div className="flex items-center gap-2">
                            Room
                            <span className="text-white/50">|</span>
                          </div>
                        </th>
                        <th className="px-8 py-4 text-left font-medium text-base">
                          <div className="flex items-center gap-2">
                            Date
                            <span className="text-white/50">|</span>
                          </div>
                        </th>
                        <th className="px-8 py-4 text-left font-medium text-base">
                          <div className="flex items-center gap-2">
                            Period
                            <span className="text-white/50">|</span>
                          </div>
                        </th>
                        <th className="px-8 py-4 text-left font-medium text-base">
                          <div className="flex items-center gap-2">
                            Amount
                            <span className="text-white/50">|</span>
                          </div>
                        </th>
                        <th className="px-8 py-4 text-left font-medium text-base">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8EFEA]">
                      {filteredHistory.map((payment) => (
                        <tr key={payment.id} className="hover:bg-[#F5F8F6] transition-colors">
                          <td className="px-8 py-5 text-base text-[#2C3B2A] font-medium">
                            {payment.resident_name}
                          </td>
                          <td className="px-8 py-5 text-base text-[#5C7361]">
                            {payment.room_number}
                          </td>
                          <td className="px-8 py-5 text-base text-[#5C7361]">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-8 py-5 text-base text-[#5C7361]">
                            {payment.period_from} to {payment.period_to}
                          </td>
                          <td className="px-8 py-5 text-base text-[#5C7361]">
                            ₹{payment.amount}
                          </td>
                          <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-sm ${
                              payment.status === 'advance' ? 'bg-blue-100 text-blue-800' : 
                              payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium text-[#2C3B2A] mb-4">Connect Payment Gateway</h3>
              <p className="text-[#5C7361] mb-8 max-w-md mx-auto">
                Set up your payment gateway to start accepting payments from residents securely.
              </p>
              <button
                onClick={handleStripeConnect}
                disabled={loading}
                className="bg-[#395917] text-white px-8 py-3 rounded-lg hover:bg-[#2C3B2A] disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 flex items-center gap-2 mx-auto"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>Connect Payment Gateway</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
  );
};

export default AdminStripeSetup;