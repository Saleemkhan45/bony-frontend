function StepsConnector() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-1 hidden h-28 lg:block"
      aria-hidden="true"
    >
      <svg viewBox="0 0 960 140" className="h-full w-full">
        <path
          d="M160 60C220 24 280 24 340 60C392 92 434 92 480 60"
          fill="none"
          stroke="#ddd7f7"
          strokeWidth="2"
          strokeDasharray="5 8"
          strokeLinecap="round"
        />
        <path
          d="M490 60C548 24 616 24 676 60C732 92 782 92 840 60"
          fill="none"
          stroke="#ddd7f7"
          strokeWidth="2"
          strokeDasharray="5 8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default StepsConnector;

