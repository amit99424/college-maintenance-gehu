import React from "react";

interface SelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  name?: string;
}

const SelectDropdown: React.FC<SelectDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  required = false,
  name,
}) => {
  return (
    <select
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className={`w-full p-3 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
        required && !value ? "border-red-500" : ""
      }`}
    >
      <option key="placeholder" value="" disabled>
        {placeholder}
      </option>
      {options.map((opt, index) => (
        <option key={`${opt.value}-${index}`} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

export default SelectDropdown;
