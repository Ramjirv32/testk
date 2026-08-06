'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/config';

export default function CheckPage() {
  const [status, setStatus] = useState<string>('checking...');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const checkAutomation = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/check/automate`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setStatus(data.status);
        setMessage(data.message);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setStatus('error');
      } finally {
        setLoading(false);
      }
    };

    checkAutomation();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-indigo-600 mb-8">
          System Check
        </h1>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
              <p className="mt-4 text-gray-600">Checking automation status...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold">Error</p>
              <p className="text-red-600 text-sm mt-2">{error}</p>
            </div>
          ) : (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-green-800 font-semibold">Status:</span>
                  <span className="inline-block bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold capitalize">
                    {status}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 font-semibold mb-2">Message:</p>
                <p className="text-blue-600">{message}</p>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="text-indigo-800 text-sm">
                   System is automated and running smoothly
                </p>
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => window.location.reload()}
          className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
