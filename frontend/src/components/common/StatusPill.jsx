const StatusPill = ({ config, size = "sm" }) => {
  const sizeClasses = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";
  if (!config) return null;
  return (
    <span
      className={`inline-flex items-center rounded-md font-medium ${config.bg} ${config.text} ${sizeClasses}`}
    >
      {config.label}
    </span>
  );
};

export default StatusPill;
