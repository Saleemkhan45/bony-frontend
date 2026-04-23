import { useNavigationMenu } from '@/features/home/hooks';
import { Button } from '@/shared/ui/Button';

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M4 7H20M4 12H20M4 17H20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M6 6L18 18M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Navbar({ links, action }) {
  const { isOpen, closeMenu, toggleMenu } = useNavigationMenu();

  return (
    <nav className="relative z-20 pb-1">
      <div className="flex items-center justify-between gap-3 sm:gap-5">
        <a href="/" className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
          Bony.
        </a>

        <div className="hidden items-center gap-5 rounded-full bg-white/80 px-5 py-2.5 text-[13px] font-semibold text-slate-600 shadow-sm backdrop-blur xl:flex">
          {links.map((link) => (
            <a key={link.label} href={link.href} className="transition-colors duration-200 hover:text-ink">
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <Button
            href={action.href}
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex sm:px-4"
          >
            {action.label}
          </Button>

          <button
            type="button"
            onClick={toggleMenu}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8d5ff] bg-white text-ink shadow-sm transition-colors duration-200 hover:border-accent hover:text-accent sm:h-11 sm:w-11 xl:hidden"
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {isOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="mt-3 max-h-[min(70vh,30rem)] overflow-y-auto rounded-[24px] border border-white/60 bg-white/95 p-4 shadow-xl backdrop-blur sm:mt-4 sm:rounded-[28px] sm:p-5 xl:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={closeMenu}
                className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:bg-[#f6f7ff] hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </div>

          <Button href={action.href} variant="outline" className="mt-4 w-full justify-center sm:mt-5">
            {action.label}
          </Button>
        </div>
      ) : null}
    </nav>
  );
}

export default Navbar;
