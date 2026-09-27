import useInView from "../hooks/useInView";

export default function Reveal({ as: Tag = "div", delay = 0, className = "", style, children, ...rest }) {
  const [ref, inView] = useInView();
  return (
    <Tag
      ref={ref}
      className={`reveal ${inView ? "in" : ""} ${className}`}
      style={{ transitionDelay: inView ? `${delay}ms` : "0ms", ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
