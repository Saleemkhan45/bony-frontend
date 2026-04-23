import { MailIcon, PhoneCallIcon } from '@/features/home/components/icons/HomeIcons';

const iconMap = {
  mail: MailIcon,
  phone: PhoneCallIcon,
};

function FooterContactsColumn({ contacts }) {
  return (
    <div>
      <h3 className="text-[16px] font-bold tracking-tight text-white">{contacts.title}</h3>
      <p className="mt-4 max-w-[230px] text-[12px] font-medium leading-6 text-white/72 sm:mt-5">
        {contacts.description}
      </p>

      <ul className="mt-4 space-y-3 sm:mt-5 sm:space-y-3.5">
        {contacts.items.map((item) => {
          const Icon = iconMap[item.icon];

          return (
            <li key={item.label}>
              <a
                href={item.href}
                className="inline-flex items-center gap-2.5 text-[12px] font-medium text-white/82 transition-colors duration-200 hover:text-white"
              >
                {Icon ? <Icon className="h-4 w-4 shrink-0 text-white/65" /> : null}
                <span>{item.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default FooterContactsColumn;
