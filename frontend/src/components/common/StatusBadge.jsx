export default function StatusBadge({ status, deletedAt, config = {} }) {
  if (deletedAt) {
    return <Badge text="Đã xóa" className="bg-red-100 text-red-700" />;
  }

  const current = config[Number(status)];

  if (!current) return null;

  return <Badge text={current.label} className={current.className} />;
}

function Badge({ text, className }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${className}`}
    >
      {text}
    </span>
  );
}
