import { useState } from 'react';
import axios from 'axios';

export default function TestAPI() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/');
      setResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      setResult(`Error: ${error.message}\n${JSON.stringify(error.response?.data, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  const testRegister = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/users/register/', {
        email: `test${Date.now()}@example.com`,
        username: `testuser${Date.now()}`,
        first_name: 'Test',
        last_name: 'User',
        password: 'password123',
        password2: 'password123',
        role: 'freelancer'
      });
      setResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      setResult(`Error: ${error.message}\n${JSON.stringify(error.response?.data, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/token/', {
        email: 'alex.dev@example.com',
        password: 'password123'
      });
      setResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      setResult(`Error: ${error.message}\n${JSON.stringify(error.response?.data, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">API Connection Test</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={testConnection}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Test API Connection
        </button>
        
        <button
          onClick={testRegister}
          disabled={loading}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 ml-4"
        >
          Test Registration
        </button>
        
        <button
          onClick={testLogin}
          disabled={loading}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 ml-4"
        >
          Test Login (Seed User)
        </button>
      </div>

      {loading && <p className="text-gray-600">Loading...</p>}
      
      {result && (
        <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-sm">
          {result}
        </pre>
      )}
    </div>
  );
}