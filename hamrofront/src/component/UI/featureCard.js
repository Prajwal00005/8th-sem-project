import React from 'react';

export default function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg">
      <div className="p-6">
        <div className="mb-4 text-[#2C3B2A]">{icon}</div>
        <h3 className="text-xl font-bold text-[#2C3B2A] mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
}