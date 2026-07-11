const parentBadgeColors = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
];

export function getParentBadgeColor(parentId) {
  const id = Number(parentId);

  if (!Number.isFinite(id)) {
    return "bg-slate-100 text-slate-700";
  }

  return parentBadgeColors[Math.abs(id) % parentBadgeColors.length];
}