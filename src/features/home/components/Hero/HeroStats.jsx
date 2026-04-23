function StarRow({ color }) {
  return (
    <div className="flex items-center justify-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <svg key={index} viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true">
          <path
            d="M10 1.8L12.45 6.76L17.92 7.56L13.96 11.42L14.89 16.88L10 14.3L5.11 16.88L6.04 11.42L2.08 7.56L7.55 6.76L10 1.8Z"
            fill={color}
          />
        </svg>
      ))}
    </div>
  );
}

function BrandLogo({ brand }) {
  if (brand.id === 'slack') {
    return (
      <div className="flex items-center gap-2 text-[#252945]">
        <span className="grid h-4 w-4 rotate-12 grid-cols-2 gap-px">
          <span className="rounded-sm bg-[#36c5f0]" />
          <span className="rounded-sm bg-[#2eb67d]" />
          <span className="rounded-sm bg-[#ecb22e]" />
          <span className="rounded-sm bg-[#e01e5a]" />
        </span>
        <span className="text-[14px] font-semibold tracking-tight sm:text-[16px]">{brand.label}</span>
      </div>
    );
  }

  if (brand.id === 'microsoft') {
    return (
      <div className="flex items-center gap-2 text-[#4f556a]">
        <span className="grid h-4 w-4 grid-cols-2 gap-px">
          <span className="bg-[#f25022]" />
          <span className="bg-[#7fba00]" />
          <span className="bg-[#00a4ef]" />
          <span className="bg-[#ffb900]" />
        </span>
        <span className="text-[14px] font-medium tracking-tight sm:text-[16px]">{brand.label}</span>
      </div>
    );
  }

  if (brand.id === 'facebook') {
    return (
      <div className="text-[14px] font-bold tracking-tight text-[#1877f2] sm:text-[16px]">
        {brand.label}
      </div>
    );
  }

  return (
    <div className="relative text-[14px] font-bold tracking-tight text-[#2b2f3a] sm:text-[16px]">
      {brand.label}
      <svg viewBox="0 0 64 16" className="absolute -bottom-2 left-1.5 h-3 w-12" aria-hidden="true">
        <path
          d="M2 3.5C16.5 14 35.5 14.5 61 2"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function HeroStats({ socialProof }) {
  return (
    <div className="border-t border-slate-200/90 pt-8 sm:pt-10">
      <div className="mx-auto max-w-[900px] rounded-[24px] border border-white/80 bg-white/70 px-4 py-6 shadow-[0_28px_70px_-42px_rgba(24,33,77,0.35)] backdrop-blur sm:px-6 sm:py-7 md:rounded-[28px] md:px-8">
        <div className="flex flex-col gap-7 sm:gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-2 gap-6 sm:flex sm:flex-wrap sm:items-start sm:justify-center sm:gap-10 lg:justify-start lg:gap-14">
            {socialProof.stats.map((stat) => (
              <div key={stat.label} className="min-w-[92px] text-center">
                <p className="text-[32px] font-extrabold tracking-[-0.05em] text-ink sm:text-[38px] md:text-[40px]">
                  {stat.value}
                </p>
                <div className="mt-2">
                  <StarRow color={stat.starColor} />
                </div>
                <p className="mt-2 text-[11px] font-medium tracking-tight text-slate-600 sm:text-xs">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-3 lg:items-start">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600 sm:text-xs">
              {socialProof.heading}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:gap-x-6 lg:justify-start">
              {socialProof.brands.map((brand) => (
                <BrandLogo key={brand.id} brand={brand} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroStats;
