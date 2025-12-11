// frontend/src/components/OnboardingStepper.jsx
export default function OnboardingStepper({ currentStep, totalSteps }) {
  return (
    <div className="flex items-center justify-center mb-4 select-none">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} className="flex items-center">
          
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center font-semibold text-[10px] leading-none
              ${i < currentStep
                ? 'bg-green-500 text-white'
                : i === currentStep
                ? 'bg-purple-600 text-white'
                : 'bg-gray-300 text-gray-700'}
            `}
            aria-current={i === currentStep ? 'step' : undefined}
          >
            {i + 1}
          </div>

          {i < totalSteps - 1 && (
            <div
              className={`w-8 h-0.5 mx-1
                ${i < currentStep ? 'bg-green-500' : 'bg-gray-300'}
              `}
            />
          )}
        </div>
      ))}
    </div>
  );
}
