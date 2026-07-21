export function getRankBadgeClass(rank) {
  const value = Number(rank);

  if (value === 1) {
    return "rank-badge rank-badge-1 bg-amber-100 text-amber-800 ring-1 ring-amber-300";
  }

  if (value === 2) {
    return "rank-badge rank-badge-2 bg-slate-200 text-slate-700 ring-1 ring-slate-300";
  }

  if (value === 3) {
    return "rank-badge rank-badge-3 bg-orange-100 text-orange-800 ring-1 ring-orange-300";
  }

  return "rank-badge rank-badge-other bg-slate-100 text-slate-600 ring-1 ring-slate-200";
}
