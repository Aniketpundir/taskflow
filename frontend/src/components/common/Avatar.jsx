/**
 * Renders a circular avatar with the user's initials on their assigned
 * color. Falls back gracefully if a name isn't provided.
 */
const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const SIZES = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
};

const Avatar = ({ name, color = "#6366F1", size = "sm", className = "" }) => {
  return (
    <div
      className={`flex items-center justify-center rounded-full font-semibold text-white shrink-0 ring-2 ring-white ${SIZES[size]} ${className}`}
      style={{ backgroundColor: color }}
      title={name}
    >
      {getInitials(name) || "?"}
    </div>
  );
};

export default Avatar;
