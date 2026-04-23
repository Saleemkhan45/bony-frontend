function AudioLevelMeter({ disabled = false, level = 0 }) {
  const bars = [0.18, 0.35, 0.52, 0.69, 0.86];

  return (
    <div className="flex items-end gap-1.5">
      {bars.map((threshold, index) => {
        const isActive = !disabled && level >= threshold;

        return (
          <span
            key={threshold}
            className={`w-2 rounded-full transition-all duration-150 ${
              isActive ? 'bg-[var(--meeting-accent)]' : 'bg-[#d9def2]'
            }`}
            style={{
              height: `${16 + index * 6}px`,
              opacity: disabled ? 0.45 : isActive ? 1 : 0.7,
            }}
          />
        );
      })}
    </div>
  );
}

export default AudioLevelMeter;
