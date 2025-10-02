import React from "react";
import Select, { SingleValue, components } from "react-select";

interface Option {
  value: string;
  label: string;
  icon?: string; // added icon property
}

interface ThirdPartyAutocompleteDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  required?: boolean;
  name?: string;
}

// Custom Option component to render icon and label
const IconOption = (props: any) => {
  const { data, innerRef, innerProps, isFocused, isSelected } = props;
  return (
    <div
      ref={innerRef}
      {...innerProps}
      style={{
        backgroundColor: isFocused ? "#2563eb" : isSelected ? "#2563eb" : "white",
        color: isFocused || isSelected ? "white" : "black",
        padding: "8px 12px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
      }}
    >
      {data.icon && <span style={{ marginRight: 8 }}>{data.icon}</span>}
      {data.label}
    </div>
  );
};

// Custom SingleValue component to render icon and label in selected value
const IconSingleValue = (props: any) => {
  const { data } = props;
  return (
    <components.SingleValue {...props}>
      {data.icon && <span style={{ marginRight: 8 }}>{data.icon}</span>}
      {data.label}
    </components.SingleValue>
  );
};

const ThirdPartyAutocompleteDropdown: React.FC<ThirdPartyAutocompleteDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder,
  required = false,
  name,
}) => {
  const selectedOption = options.find((opt) => opt.value === value) || null;

  const handleChange = (selected: SingleValue<Option>) => {
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
      components={{ Option: IconOption, SingleValue: IconSingleValue }}
      styles={{
        control: (provided) => ({
          ...provided,
          borderColor: required && !value ? "#ef4444" : provided.borderColor, // red border if required and no value
          boxShadow: "none",
          "&:hover": {
            borderColor: "#2563eb",
          },
        }),
        menu: (provided) => ({
          ...provided,
          zIndex: 9999,
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }),
        option: (provided, state) => ({
          ...provided,
          backgroundColor: state.isFocused ? "#2563eb" : "white",
          color: state.isFocused ? "white" : "black",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
        }),
        singleValue: (provided) => ({
          ...provided,
          display: "flex",
          alignItems: "center",
        }),
      }}
    />
  );
};

export default ThirdPartyAutocompleteDropdown;
