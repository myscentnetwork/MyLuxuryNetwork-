"use client";

interface FormCheckboxGroupProps {
  label?: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  hint?: string;
  columns?: 2 | 3 | 4 | 6;
  variant?: "default" | "gold" | "blue" | "purple";
}

const variantStyles = {
  default: {
    active: "bg-luxury-gold text-black font-medium",
    inactive: "bg-luxury-dark border border-gray-600 text-gray-300 hover:border-gray-500",
  },
  gold: {
    active: "bg-luxury-gold text-black font-medium",
    inactive: "bg-luxury-dark border border-gray-600 text-gray-300 hover:border-gray-500",
  },
  blue: {
    active: "bg-blue-500 text-white font-medium",
    inactive: "bg-luxury-dark border border-gray-600 text-gray-300 hover:border-gray-500",
  },
  purple: {
    active: "bg-purple-500 text-white font-medium",
    inactive: "bg-luxury-dark border border-gray-600 text-gray-300 hover:border-gray-500",
  },
};

export function FormCheckboxGroup({
  label,
  options,
  selected,
  onChange,
  hint,
  columns = 4,
  variant = "default",
}: FormCheckboxGroupProps) {
  const toggle = (option: string) => {
    onChange(
      selected.includes(option)
        ? selected.filter((s) => s !== option)
        : [...selected, option]
    );
  };

  const styles = variantStyles[variant];

  return (
    <div className="w-full">
      {label && (
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          {label}
          {selected.length > 0 && (
            <span className="text-sm font-normal text-gray-400">
              ({selected.length} selected)
            </span>
          )}
        </h3>
      )}
      <div className="bg-luxury-gray border border-gray-600 rounded-lg p-4">
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <label
              key={option}
              className={`px-4 py-2 rounded-lg cursor-pointer transition-all ${
                selected.includes(option) ? styles.active : styles.inactive
              }`}
            >
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggle(option)}
                className="sr-only"
              />
              {option}
            </label>
          ))}
        </div>
      </div>
      {hint && <p className="mt-1 text-sm text-gray-500">{hint}</p>}
    </div>
  );
}
