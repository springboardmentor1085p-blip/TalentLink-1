import { Star } from 'lucide-react';

export default function RatingDisplay({ rating, showNumber = true, size = 'md', className = '' }) {
  const sizes = {
    sm: 14,
    md: 18,
    lg: 24,
  };

  const starSize = sizes[size] || sizes.md;
  const maxRating = 5;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[...Array(maxRating)].map((_, index) => {
        const starValue = index + 1;
        const filled = starValue <= Math.floor(rating);
        const partial = starValue === Math.ceil(rating) && rating % 1 !== 0;

        return (
          <div key={index} className="relative">
            {partial ? (
              <div className="relative">
                <Star
                  size={starSize}
                  className="text-gray-300"
                  fill="currentColor"
                />
                <div
                  className="absolute top-0 left-0 overflow-hidden"
                  style={{ width: `${(rating % 1) * 100}%` }}
                >
                  <Star
                    size={starSize}
                    className="text-yellow-400"
                    fill="currentColor"
                  />
                </div>
              </div>
            ) : (
              <Star
                size={starSize}
                className={filled ? 'text-yellow-400' : 'text-gray-300'}
                fill="currentColor"
              />
            )}
          </div>
        );
      })}
      {showNumber && (
        <span className={`font-semibold text-gray-700 ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'}`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}