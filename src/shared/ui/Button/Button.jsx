const baseStyles =
  'inline-flex min-h-[44px] items-center justify-center rounded-xl font-bold transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-accent/30';

const variantStyles = {
  solid: 'bg-accent text-white shadow-[0_22px_40px_-18px_rgba(105,92,251,0.75)]',
  outline: 'border border-[#cfcafe] bg-white text-accent shadow-sm',
};

const sizeStyles = {
  sm: 'px-4 py-3 text-[13px]',
  md: 'px-6 py-4 text-sm',
};

function Button({
  as = 'button',
  children,
  className = '',
  href,
  size = 'md',
  type = 'button',
  variant = 'solid',
  ...props
}) {
  const sharedClassName = [baseStyles, variantStyles[variant], sizeStyles[size], className]
    .filter(Boolean)
    .join(' ');

  if (as === 'a' || href) {
    return (
      <a href={href} className={sharedClassName} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={sharedClassName} {...props}>
      {children}
    </button>
  );
}

export default Button;
