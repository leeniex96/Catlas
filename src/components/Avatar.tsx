// A round profile picture. If the person hasn't added one, shows their first initial instead.
// The name is always written next to it, so the image itself is decorative (empty alt text).

const SIZES = {
  sm: "h-9 w-9 text-base",
  md: "h-12 w-12 text-xl",
  lg: "h-24 w-24 text-4xl",
} as const;

export default function Avatar({
  name,
  url,
  size = "md",
}: {
  name: string;
  url?: string;
  size?: keyof typeof SIZES;
}) {
  const classes = `${SIZES[size]} shrink-0 rounded-full`;

  if (url) {
    return <img src={url} alt="" loading="lazy" className={`${classes} border border-cream-200 object-cover`} />;
  }
  return (
    <span
      aria-hidden="true"
      className={`${classes} grid place-items-center bg-accent-100 font-serif font-semibold text-accent-700`}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
