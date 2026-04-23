function DeviceSelectorRow({
  disabled = false,
  helperText = '',
  label,
  onChange,
  options,
  value,
}) {
  const hasOptions = options.length > 0;

  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b84a4]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled || !hasOptions}
        className="w-full rounded-[22px] border border-[var(--meeting-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--meeting-text)] outline-none transition focus:border-[#8c81ff] focus:ring-4 focus:ring-[#8c81ff]/12 disabled:cursor-not-allowed disabled:bg-[#f4f6fd] disabled:text-[#98a0b7]"
      >
        <option value="">
          {hasOptions ? `Use default ${label.toLowerCase()}` : `No ${label.toLowerCase()} found`}
        </option>
        {options.map((option) => (
          <option key={option.deviceId || option.label} value={option.deviceId}>
            {option.label}
          </option>
        ))}
      </select>

      {helperText ? (
        <p className="mt-2 text-sm text-[var(--meeting-muted)]">{helperText}</p>
      ) : null}
    </label>
  );
}

export default DeviceSelectorRow;
