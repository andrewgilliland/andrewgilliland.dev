import { FC } from "react";

type SelectProps = {
  label: string;
  id: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
};

const Select: FC<SelectProps> = ({ label, id, value, onChange, options }) => {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-white">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        //     (event: React.ChangeEvent<HTMLSelectElement>) =>
        //   setChartType(event.target.value as ChartType)
        className="rounded-lg border-2 border-white bg-black px-4 py-3"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;
