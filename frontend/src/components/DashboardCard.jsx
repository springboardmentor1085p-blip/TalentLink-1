// frontend/src/components/DashboardCard.jsx
import { formatCurrency } from '../utils/currency';
export default function DashboardCard({ title, value, icon: Icon, color = 'purple', isCurrency = false }) {
  const colorClasses = {
    purple: 'bg-purple-100 text-purple-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  const displayValue = isCurrency ? formatCurrency(value) : value;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600 text-sm font-medium">{title}</span>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900">{displayValue}</div>
    </div>
  );
}