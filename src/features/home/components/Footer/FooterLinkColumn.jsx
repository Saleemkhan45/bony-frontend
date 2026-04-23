function FooterLinkColumn({ column }) {
  return (
    <div>
      <h3 className="text-[16px] font-bold tracking-tight text-white">{column.title}</h3>

      <ul className="mt-4 space-y-2.5 sm:mt-6 sm:space-y-3">
        {column.links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="inline-flex py-0.5 text-[12px] font-medium text-white/75 transition-colors duration-200 hover:text-white"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FooterLinkColumn;
