import React from "react";
import Select from "react-select";

interface Option {
  value: string;
  label: string;
}

interface ThirdPartyAutocompleteDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  required?: boolean;
  name?: string;
}

const ThirdPartyAutocompleteDropdown: React.FC<ThirdPartyAutocompleteDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder,
  required = false,
  name,
}) => {
  const selectedOption = options.find((opt) => opt.value === value) || null;

  const handleChange = (selected: any) => {
    onChange(selected ? selected.value : "");
  };

  return (
    <Select
      inputId={name}
      value={selectedOption}
      onChange={handleChange}
      options={options}
      placeholder={placeholder}
      isClearable={!required}
      classNamePrefix="react-select"
    />
  );
};

export default ThirdPartyAutocompleteDropdown;
