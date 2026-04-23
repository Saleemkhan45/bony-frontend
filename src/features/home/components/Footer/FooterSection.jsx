import { footerContent } from '@/features/home/data/homeContent';
import { Button } from '@/shared/ui/Button';
import { Container } from '@/shared/ui/Container';

import FooterContactsColumn from './FooterContactsColumn';
import FooterLinkColumn from './FooterLinkColumn';
import FooterSocialLinks from './FooterSocialLinks';

function FooterSection() {
  const content = footerContent;

  return (
    <footer id={content.id} className="relative overflow-hidden bg-[#172b45] pb-6 pt-12 text-white/80 sm:pt-14 lg:pt-16">
      <div className="pointer-events-none absolute -left-12 top-12 h-36 w-36 rounded-full bg-[#26466d]/40 blur-sm" />
      <div className="pointer-events-none absolute bottom-8 left-[18%] h-44 w-44 rounded-full bg-[#1d3759]/50 blur-sm" />
      <div className="pointer-events-none absolute right-10 top-20 h-20 w-20 rounded-full bg-[#25466d]/45" />

      <Container className="relative z-10">
        <div className="grid gap-8 border-b border-white/8 pb-10 sm:pb-12 md:grid-cols-2 md:gap-10 lg:grid-cols-[minmax(0,1.45fr)_repeat(3,minmax(0,0.85fr))] lg:gap-12">
          <div className="max-w-[280px]">
            <h2 className="text-[28px] font-extrabold tracking-[-0.05em] text-white">
              {content.brand.name}
            </h2>
            <p className="mt-5 text-[12px] font-medium leading-6 text-white/72">
              {content.brand.description}
            </p>

            <Button
              as="a"
              href={content.brand.action.href}
              size="sm"
              className="mt-7 rounded-[12px] bg-accent px-5 text-[12px] shadow-[0_24px_44px_-24px_rgba(105,92,251,0.85)]"
            >
              {content.brand.action.label}
            </Button>
          </div>

          {content.columns.map((column) => (
            <FooterLinkColumn key={column.title} column={column} />
          ))}

          <FooterContactsColumn contacts={content.contacts} />
        </div>

        <div className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
          <p className="text-[11px] font-medium text-white/65">{content.copyright}</p>
          <FooterSocialLinks socials={content.socials} />
        </div>
      </Container>
    </footer>
  );
}

export default FooterSection;
