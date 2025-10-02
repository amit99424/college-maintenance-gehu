import React, { useState, useRef, useEffect } from "react";

interface CategoryOption {
  value: string;
  label: string;
  icon?: string;
}

interface EnhancedDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: CategoryOption[];
  placeholder: string;
  required?: boolean;
  name?: string;
}

const EnhancedDropdown: React.FC<EnhancedDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder,
  required = false,
  name,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFilter("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter options based on input filter
  const filteredOptions = options.filter((opt) =>
    opt.label && filter
      ? opt.label?.toLowerCase().includes(filter?.toLowerCase())
      : true
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
    setIsOpen(true);
  };

  const handleOptionClick = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setFilter("");
  };

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        type="text"
        name={name}
        value={isOpen ? filter : selectedOption ? selectedOption.label : ""}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        required={required}
        className={`w-full p-3 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          required && !value ? "border-red-500" : ""
        }`}
        autoComplete="off"
      />
      {isOpen && (
        <ul
          tabIndex={-1}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border border-gray-300"
          style={{ boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <li
                key={`${option.value}-${index}`}
                role="option"
                aria-selected={value === option.value}
                onClick={() => handleOptionClick(option.value)}
                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-600 hover:text-white ${
                  value === option.value ? "font-semibold bg-blue-600 text-white" : "text-gray-900"
                }`}
              >
                <span className="flex items-center">
                  {option.icon && <span className="mr-2">{option.icon}</span>}
                  {option.label}
                </span>
              </li>
            ))
          ) : (
            <li className="cursor-default select-none relative py-2 pl-3 pr-9 text-gray-500">
              No options found
            </li>
          )}
        </ul>
      )}
      {/* Hidden input for form validation */}
      <input type="hidden" name={name} value={value} required={required} />
    </div>
  );
};

export default EnhancedDropdown;
