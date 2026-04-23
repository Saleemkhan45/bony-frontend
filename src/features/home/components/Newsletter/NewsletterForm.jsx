import { Button } from '@/shared/ui/Button';

function NewsletterForm({ form }) {
  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <form
      className="w-full max-w-[430px]"
      onSubmit={handleSubmit}
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>

      <div className="flex flex-col gap-2.5 rounded-[14px] bg-white/10 p-2 backdrop-blur-sm sm:flex-row sm:items-center sm:gap-3 sm:rounded-[18px]">
        <input
          id="newsletter-email"
          type="email"
          placeholder={form.placeholder}
          className="h-11 w-full rounded-[12px] border border-white/15 bg-white px-4 text-[13px] font-medium text-ink outline-none transition-shadow duration-200 placeholder:text-slate-500 focus:shadow-[0_0_0_3px_rgba(255,255,255,0.18)] sm:h-12"
        />

        <Button
          type="submit"
          size="sm"
          className="h-11 w-full min-w-[126px] justify-center rounded-[12px] bg-[#6b57fb] px-5 text-[13px] font-semibold shadow-[0_20px_34px_-22px_rgba(32,15,112,0.95)] hover:bg-[#5e49f5] sm:h-12 sm:w-auto"
        >
          {form.buttonLabel}
        </Button>
      </div>
    </form>
  );
}

export default NewsletterForm;
