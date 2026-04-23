function Container({ as: Tag = 'div', children, className = '', ...props }) {
  return (
    <Tag
      className={`mx-auto w-full max-w-[82rem] px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}

export default Container;
