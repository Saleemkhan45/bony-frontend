import { PhoneCallIcon, ShieldCheckIcon, VideoIcon } from '@/features/home/components/icons/HomeIcons';

const iconMap = {
  video: VideoIcon,
  shield: ShieldCheckIcon,
  phone: PhoneCallIcon,
};

function MadeForYouCard({ item }) {
  const Icon = iconMap[item.icon];

  return (
    <article
      className={`flex min-h-[190px] flex-col items-center rounded-[14px] px-6 py-7 text-center sm:min-h-[208px] sm:px-7 sm:py-9 ${item.cardClassName}`}
    >
      <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-[0_18px_30px_-18px_rgba(24,33,77,0.28)] sm:mb-6 sm:h-12 sm:w-12">
        {Icon ? <Icon className={`h-5 w-5 stroke-[2.25] ${item.iconToneClassName}`} /> : null}
      </div>

      <h3 className="text-[16px] font-bold tracking-tight text-ink">{item.title}</h3>
      <p className="mt-3 max-w-[220px] text-[12px] font-medium leading-6 text-slate-500 sm:mt-4 sm:max-w-[200px] sm:text-[11px]">
        {item.description}
      </p>
    </article>
  );
}

export default MadeForYouCard;
