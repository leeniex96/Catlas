import { ICONS, type IconName } from "@/lib/icons";

/**
 * A Tabler icon. It takes the text color of whatever it sits in, and its size from `className`
 * (for example "h-4 w-4"). Icons are decoration: put the meaning in nearby text or an aria-label.
 *
 * `thin` draws the icon with a hairline: exactly 1px wide at any size. (Normal Tabler icons use a
 * 2-unit line that grows and shrinks with the icon.)
 */
export default function Icon({
  name,
  className = "h-5 w-5",
  thin = false,
}: {
  name: IconName;
  className?: string;
  thin?: boolean;
}) {
  const thinClasses = thin ? "[&_svg]:[stroke-width:1px] [&_svg_*]:[vector-effect:non-scaling-stroke]" : "";
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 [&>svg]:h-full [&>svg]:w-full ${thinClasses} ${className}`}
      // The SVG text comes from our own icon files above, never from users.
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  );
}
