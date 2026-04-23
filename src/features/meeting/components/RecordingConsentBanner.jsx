function RecordingConsentBanner({ isVisible }) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="rounded-[24px] border border-[#ffd6e0] bg-[#fff1f5] px-4 py-3 text-sm font-medium text-[#9d3654] shadow-[0_12px_30px_rgba(217,79,115,0.12)]">
      A shared meeting recording session is active. Participants should know this room may be archived by the host or a co-host.
    </div>
  );
}

export default RecordingConsentBanner;
