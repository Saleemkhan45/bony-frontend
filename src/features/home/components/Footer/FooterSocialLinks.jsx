import { AtSignIcon, GlobeIcon, SendIcon } from '@/features/home/components/icons/HomeIcons';

const iconMap = {
  at: AtSignIcon,
  globe: GlobeIcon,
  send: SendIcon,
};

function FooterSocialLinks({ socials }) {
  return (
    <div className="flex items-center gap-2">
      {socials.map((item) => {
        const Icon = iconMap[item.icon];

        return (
          <a
            key={item.icon}
            href={item.href}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/82 transition-colors duration-200 hover:border-white/35 hover:bg-white/16 hover:text-white sm:h-8 sm:w-8"
            aria-label={item.icon}
          >
            {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
          </a>
        );
      })}
    </div>
  );
}

export default FooterSocialLinks;
