import React from "react";
import Select, { components } from "react-select";

const techOptions = [
  { value: "react", label: "ReactJS" },
  { value: "nodejs", label: "Node.js" },
  { value: "supabase", label: "supabase" },
  { value: "typescript", label: "TypeScript" },
  { value: "nextjs", label: "NextJS" },
  { value: "redux", label: "Redux" },
  { value: "firebase", label: "Firebase" },
  { value: "tailwindcss", label: "TailwindCSS" },
  { value: "javascript", label: "JavaScript" },
  { value: "vue", label: "Vue.js" },
  { value: "angular", label: "Angular" },
  { value: "python", label: "Python" },
  { value: "django", label: "Django" },
  { value: "flask", label: "Flask" },
  { value: "express", label: "Express" },
  { value: "mongodb", label: "MongoDB" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL" },
  { value: "graphql", label: "GraphQL" },
  { value: "docker", label: "Docker" },
  { value: "kubernetes", label: "Kubernetes" },
  { value: "aws", label: "AWS" },
  { value: "gcp", label: "Google Cloud" },
  { value: "azure", label: "Azure" },
  { value: "php", label: "PHP" },
  { value: "laravel", label: "Laravel" },
  { value: "ruby", label: "Ruby" },
  { value: "rails", label: "Rails" },
  { value: "csharp", label: "C#" },
  { value: "dotnet", label: ".NET" },
  { value: "java", label: "Java" },
  { value: "spring", label: "Spring" },
  { value: "go", label: "Go" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "flutter", label: "Flutter" },
  { value: "reactnative", label: "React Native" },
  { value: "svelte", label: "Svelte" },
  { value: "other", label: "Other" },
];

const customStyles = {
  control: (provided) => ({
    ...provided,
    borderRadius: "1rem",
    minHeight: "48px",
    borderColor: "#e5e7eb",
    boxShadow: "none",
    padding: "2px 4px",
    background: "#f9fafb",
  }),
  multiValue: (provided) => ({
    ...provided,
    borderRadius: "1rem",
    background: "#f3f6fa",
    border: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    padding: "2px 8px",
    fontWeight: 500,
    fontSize: "1rem",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    padding: 0,
    display: "flex",
    alignItems: "center",
    fontWeight: 500,
    fontSize: "1rem",
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    borderRadius: "50%",
    background: "transparent",
    color: "#64748b",
    ":hover": { background: "#e5e7eb", color: "#ef4444" },
    marginLeft: 4,
  }),
  option: (provided, state) => ({
    ...provided,
    borderRadius: "1rem",
    background: state.isFocused ? "#f3f6fa" : "#fff",
    color: "#222",
    display: "flex",
    alignItems: "center",
    fontWeight: 500,
    fontSize: "1rem",
    padding: "8px 16px",
    cursor: "pointer",
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: "1rem",
    boxShadow: "0 4px 24px 0 rgba(0,0,0,0.08)",
    marginTop: 4,
    zIndex: 20,
  }),
  input: (provided) => ({
    ...provided,
    fontSize: "1rem",
    fontWeight: 500,
    margin: 0,
    padding: 0,
  }),
};

const MultiValueLabel = (props) => (
  <components.MultiValueLabel {...props}>
    {props.data.label}
  </components.MultiValueLabel>
);

const Option = (props) => (
  <components.Option {...props}>
    {props.data.label}
  </components.Option>
);

const formatCreateLabel = (inputValue) => `Add "${inputValue}"`;

const relatedSuggestions = (selected) => {
  const selectedValues = selected.map((s) => s.value);
  let suggestions = [];
  if (selectedValues.includes("react") && !selectedValues.includes("redux")) {
    suggestions.push("redux");
  }
  if (
    selectedValues.includes("nodejs") &&
    !selectedValues.includes("typescript")
  ) {
    suggestions.push("typescript");
  }
  if (selectedValues.includes("vue") && !selectedValues.includes("vuex")) {
    suggestions.push("vuex");
  }
  if (suggestions.length < 3) {
    suggestions = [
      ...suggestions,
      ...techOptions
        .map((opt) => opt.value)
        .filter(
          (val) => !selectedValues.includes(val) && !suggestions.includes(val),
        )
        .slice(0, 5 - suggestions.length),
    ];
  }
  return techOptions.filter((opt) => suggestions.includes(opt.value));
};

export default function BuiltWithSelect({ value, onChange }) {
  // react-select expects value as array of options
  const handleChange = (selected) => {
    if (!selected) return onChange([]);
    if (selected.length > 10) return;
    onChange(selected);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block font-semibold text-lg">Built with</label>
        <span className="text-sm text-gray-400 font-medium">Upto 10</span>
      </div>
      <Select
        isMulti
        options={techOptions}
        value={value}
        onChange={handleChange}
        placeholder="Type to search or add..."
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        components={{ MultiValueLabel, Option }}
        styles={customStyles}
        formatCreateLabel={formatCreateLabel}
        isClearable={false}
        isSearchable
        isValidNewOption={(inputValue, selectValue, selectOptions) =>
          !!inputValue &&
          !selectOptions.some(
            (option) => option.label.toLowerCase() === inputValue.toLowerCase(),
          ) &&
          selectValue.length < 10
        }
        allowCreateWhileLoading={false}
        menuPlacement="auto"
        maxMenuHeight={220}
        noOptionsMessage={({ inputValue }) =>
          inputValue ? `No results for "${inputValue}"` : "No options"
        }
      />
      <div className="mt-2">
        <div className="font-semibold mb-2 text-gray-500 text-base">
          Suggested
        </div>
        <div className="flex flex-wrap gap-2">
          {relatedSuggestions(value).map((opt) => (
            <button
              key={opt.value}
              type="button"
              className="flex items-center bg-gray-100 hover:bg-blue-100 text-gray-800 rounded-full px-3 py-1 text-sm border border-gray-200 shadow-sm transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => {
                if (
                  !value.find((v) => v.value === opt.value) &&
                  value.length < 10
                ) {
                  onChange([...value, opt]);
                }
              }}
            >
              {opt.label}
              <span className="ml-1 font-bold text-green-600">+</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
