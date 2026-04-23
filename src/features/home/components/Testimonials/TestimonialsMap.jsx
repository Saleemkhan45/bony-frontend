const clusters = [
  'left-[2%] top-[22%] h-24 w-40 [clip-path:polygon(10%_42%,22%_18%,40%_8%,56%_14%,66%_0,84%_16%,74%_38%,82%_56%,60%_68%,52%_80%,32%_78%,22%_64%,8%_58%)]',
  'left-[14%] top-[58%] h-24 w-16 [clip-path:polygon(42%_0,60%_10%,70%_30%,58%_56%,64%_82%,46%_100%,28%_84%,32%_56%,24%_26%)]',
  'left-[36%] top-[18%] h-28 w-60 [clip-path:polygon(0_52%,12%_26%,24%_12%,38%_18%,48%_6%,66%_10%,76%_22%,100%_20%,92%_38%,84%_54%,72%_62%,58%_74%,42%_70%,34%_56%,14%_60%,6%_68%)]',
  'left-[52%] top-[48%] h-24 w-20 [clip-path:polygon(40%_0,60%_10%,74%_34%,62%_74%,50%_100%,30%_76%,20%_34%)]',
  'right-[8%] top-[54%] h-14 w-24 [clip-path:polygon(6%_42%,26%_22%,54%_18%,78%_30%,92%_52%,72%_74%,40%_82%,16%_66%)]',
];

function TestimonialsMap() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden opacity-95 md:block" aria-hidden="true">
      {clusters.map((className) => (
        <div
          key={className}
          className={`absolute bg-[radial-gradient(circle,rgba(236,239,248,0.95)_1.15px,transparent_1.35px)] [background-size:8px_8px] ${className}`}
        />
      ))}
    </div>
  );
}

export default TestimonialsMap;

