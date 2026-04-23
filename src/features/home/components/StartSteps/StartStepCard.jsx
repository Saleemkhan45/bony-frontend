import { MonitorPlayIcon, SendIcon, VideoIcon } from '@/features/home/components/icons/HomeIcons';

const iconMap = {
  play: MonitorPlayIcon,
  send: SendIcon,
  video: VideoIcon,
};

function StartStepCard({ item }) {
  const Icon = iconMap[item.icon];

  return (
    <article className="relative z-10 max-w-[260px] text-center md:max-w-[220px] md:text-left">
      <div
        className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white sm:mb-5 sm:h-14 sm:w-14 ${item.iconBoxClassName}`}
      >
        {Icon ? <Icon className="h-5 w-5 stroke-[2.2]" /> : null}
      </div>

      <h3 className="text-[17px] font-bold tracking-tight text-ink sm:text-[18px]">{item.title}</h3>
      <p className="mt-2.5 text-[12px] font-medium leading-6 text-slate-500 sm:mt-3 sm:text-[12px]">
        {item.description}
      </p>
    </article>
  );
}

export default StartStepCard;
