import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/instructor/reports', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setReports(data.reports || []);
      }

    } catch (error) {
      console.error('❌ Load data error:', error);
      setError(error.message || 'Failed to load reports data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-4">Reports & Analytics</h1>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reports...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-4">Reports & Analytics</h1>
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <h3 className="text-lg font-semibold">Error Loading Reports</h3>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={loadData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Reports & Analytics</h1>
        <p className="text-gray-600 mb-6">View performance reports and analytics for your courses</p>
        
        {reports.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">No Reports Available</h3>
            <p className="text-gray-600">Reports will appear here once you have courses with student evaluations.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Course Reports ({reports.length})</h2>
            {reports.map((report, index) => (
              <div key={report.course_id || index} className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="text-lg font-semibold mb-2">
                  {report.course_code} - {report.course_title}
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Students:</span>
                    <span className="ml-2">{report.total_students}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Evaluations:</span>
                    <span className="ml-2">{report.total_evaluations}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Average Score:</span>
                    <span className="ml-2">
                      {report.average_score ? parseFloat(report.average_score).toFixed(1) + '%' : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}



