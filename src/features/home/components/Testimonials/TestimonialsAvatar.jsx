function TestimonialsAvatar({
  avatar,
  className = '',
  isActive = false,
  onClick,
  size = 'default',
}) {
  const sizeStyles = {
    default: 'h-11 w-11 sm:h-12 sm:w-12 md:h-14 md:w-14',
    floating: 'h-11 w-11 sm:h-12 sm:w-12 md:h-14 md:w-14',
    featured: 'h-14 w-14 sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem]',
  };
  const sizeAttributes = {
    default: '(max-width: 640px) 44px, (max-width: 768px) 48px, 56px',
    floating: '(max-width: 640px) 44px, (max-width: 768px) 48px, 56px',
    featured: '(max-width: 640px) 56px, (max-width: 768px) 64px, 72px',
  };

  const sharedClassName = `relative rounded-full border bg-white p-1.5 shadow-[0_18px_36px_-24px_rgba(24,33,77,0.45)] ${
    isActive ? 'border-[#8b80ff] shadow-[0_18px_36px_-24px_rgba(124,108,255,0.45)]' : 'border-white'
  } ${className}`;

  const image = (
    <img
      src={avatar.image}
      alt={avatar.name}
      width={160}
      height={160}
      loading="lazy"
      fetchpriority="low"
      decoding="async"
      sizes={sizeAttributes[size]}
      style={avatar.imagePosition ? { objectPosition: avatar.imagePosition } : undefined}
      className={`rounded-full object-cover ${sizeStyles[size]}`}
    />
  );

  if (!onClick) {
    return <div className={sharedClassName}>{image}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${sharedClassName} transition-[border-color,box-shadow] duration-200 focus-visible:outline-none`}
      aria-label={`Show review from ${avatar.name}`}
    >
      {image}
    </button>
  );
}

export default TestimonialsAvatar;
