export const FARM_STATUS = {
  PENDING: 0,
  ACTIVE: 1,
  REJECTED: 2,
  SUSPENDED: 3,
};

export const farmStatusConfig = {
  [FARM_STATUS.PENDING]: {
    label: "Chờ duyệt",
    className: "bg-yellow-100 text-yellow-700",
  },

  [FARM_STATUS.ACTIVE]: {
    label: "Đang hoạt động",
    className: "bg-green-100 text-green-700",
  },

  [FARM_STATUS.REJECTED]: {
    label: "Bị từ chối",
    className: "bg-red-100 text-red-700",
  },

  [FARM_STATUS.SUSPENDED]: {
    label: "Đang đình chỉ",
    className: "bg-orange-100 text-orange-700",
  },
};

export function isFarmDeleted(farm) {
  return Boolean(farm?.deleted_at);
}

export function isFarmPending(farm) {
  return (
    Boolean(farm) &&
    !isFarmDeleted(farm) &&
    Number(farm.status) === FARM_STATUS.PENDING
  );
}

export function isFarmActive(farm) {
  return (
    Boolean(farm) &&
    !isFarmDeleted(farm) &&
    Number(farm.status) === FARM_STATUS.ACTIVE
  );
}

export function isFarmRejected(farm) {
  return (
    Boolean(farm) &&
    !isFarmDeleted(farm) &&
    Number(farm.status) === FARM_STATUS.REJECTED
  );
}

export function isFarmSuspended(farm) {
  return (
    Boolean(farm) &&
    !isFarmDeleted(farm) &&
    Number(farm.status) === FARM_STATUS.SUSPENDED
  );
}

export function canViewPublicFarm(farm) {
  return isFarmActive(farm);
}

export function canAccessSellerDashboard(user) {
  const farm = user?.farm;

  if (!farm || isFarmDeleted(farm)) {
    return false;
  }

  const roles = Array.isArray(user?.roles)
    ? user.roles
    : [];

  const hasRole =
    roles.includes("seller") ||
    roles.includes("admin");

  const validStatus = [
    FARM_STATUS.ACTIVE,
    FARM_STATUS.SUSPENDED,
  ].includes(Number(farm.status));

  return hasRole && validStatus;
}

export function getFarmEntryPath(user) {
  if (canAccessSellerDashboard(user)) {
    return "/seller";
  }

  return "/seller/register";
}