const Input = ({ className, label, name, type, value, onChange }) => {
  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-white"
      >
        {label}
      </label>
      <input
        type={type}
        id={name}
        value={value}
        onChange={onChange}
        className="rounded-lg border-2 border-white bg-black px-4 py-3 text-white"
      />
    </div>
  );
};

export default Input;
