import React from 'react';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#D8E3DC] to-[#C5D1C9] flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="mb-6">
                        <h1 className="text-6xl font-bold text-[#2C3B2A] mb-2">401</h1>
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-red-600 text-2xl">!</span>
                        </div>
                        <h2 className="text-2xl font-bold text-[#2C3B2A] mb-2">Access Denied</h2>
                        <p className="text-[#5C7361]">
                            You don't have permission to access this page
                        </p>
                    </div>
                    
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full bg-[#395917] text-white py-3 rounded-lg hover:bg-[#2C3B2A] transition-colors mb-4"
                    >
                        Go Back
                    </button>
                    
                    <button
                        onClick={() => navigate('/')}
                        className="w-full border border-[#395917] text-[#395917] py-3 rounded-lg hover:bg-[#395917] hover:text-white transition-colors"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;