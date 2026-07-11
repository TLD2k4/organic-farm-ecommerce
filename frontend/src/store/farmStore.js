import { create } from "zustand";

import farmService from "../services/farmService";
import { useAuthStore } from "./authStore";
function getFarmFromResponse(res) {
  return (
    res?.data?.farm ??
    res?.farm ??
    res?.data ??
    null
  );
}
async function refreshProfileSilently() {
  const authStore = useAuthStore.getState();

  if (!authStore.token) {
    return;
  }

  try {
    await authStore.getProfile();
  } catch {
    // Không làm hỏng action Farm nếu profile refresh lỗi.
  }
}

async function refreshProfileWhenOwnFarm(farmId) {
  const currentFarmId =
    useAuthStore.getState().user?.farm?.id;

  if (
    currentFarmId &&
    Number(currentFarmId) === Number(farmId)
  ) {
    await refreshProfileSilently();
  }
}

export const useFarmStore = create((set) => ({
  // PUBLIC
  publicFarms: [],
  publicFarm: null,
  publicMeta: null,
  publicLoading: false,
  publicDetailLoading: false,

  // OWNER
  myFarm: null,
  ownerLoading: false,
  ownerActionLoading: false,

  // ADMIN
  farms: [],
  farm: null,
  meta: null,
  loading: false,
  detailLoading: false,
  actionLoading: false,

  // PUBLIC ACTIONS
  getAll: async (params = {}) => {
    set({
      publicLoading: true,
    });

    try {
      const res =
        await farmService.getAll(params);

      set({
        publicFarms: Array.isArray(res.data)
          ? res.data
          : [],

        publicMeta: res.meta ?? null,
      });

      return res;
    } finally {
      set({
        publicLoading: false,
      });
    }
  },

  getBySlug: async (slug) => {
    set({
      publicDetailLoading: true,
      publicFarm: null,
    });

    try {
      const res =
        await farmService.getBySlug(slug);

      set({
        publicFarm: res.data ?? null,
      });

      return res;
    } finally {
      set({
        publicDetailLoading: false,
      });
    }
  },

  // OWNER ACTIONS
 // OWNER ACTIONS

getMyFarm: async () => {
  set({
    ownerLoading: true,
  });

  try {
    const res =
      await farmService.getMyFarm();

    const farm =
      getFarmFromResponse(res);

    set({
      myFarm: farm,
    });

    return res;
  } finally {
    set({
      ownerLoading: false,
    });
  }
},

registerFarm: async (data) => {
  set({
    ownerActionLoading: true,
  });

  try {
    const res =
      await farmService.register(data);

    const farm =
      getFarmFromResponse(res);

    set({
      myFarm: farm,
    });

    await refreshProfileSilently();

    return res;
  } finally {
    set({
      ownerActionLoading: false,
    });
  }
},

updateFarm: async (id, data) => {
  set({
    ownerActionLoading: true,
  });

  try {
    const res =
      await farmService.update(id, data);

    const farm =
      getFarmFromResponse(res);

    set({
      myFarm: farm,
    });

    await refreshProfileSilently();

    return res;
  } finally {
    set({
      ownerActionLoading: false,
    });
  }
},

resubmitFarm: async (id) => {
  set({
    ownerActionLoading: true,
  });

  try {
    const res =
      await farmService.resubmit(id);

    const farm =
      getFarmFromResponse(res);

    set({
      myFarm: farm,
    });

    await refreshProfileSilently();

    return res;
  } finally {
    set({
      ownerActionLoading: false,
    });
  }
},

  ownerForceDeleteFarm: async (id) => {
    set({
      ownerActionLoading: true,
    });

    try {
      const res =
        await farmService.ownerForceDelete(id);

      set({
        myFarm: null,
      });

      await refreshProfileSilently();

      return res;
    } finally {
      set({
        ownerActionLoading: false,
      });
    }
  },

  // ADMIN ACTIONS
  adminGetAll: async (params = {}) => {
    set({
      loading: true,
    });

    try {
      const res =
        await farmService.adminGetAll(params);

      set({
        farms: Array.isArray(res.data)
          ? res.data
          : [],

        meta: res.meta ?? null,
      });

      return res;
    } finally {
      set({
        loading: false,
      });
    }
  },

  adminGetById: async (id) => {
    set({
      detailLoading: true,
      farm: null,
    });

    try {
      const res =
        await farmService.adminGetById(id);

      set({
        farm: res.data ?? null,
      });

      return res;
    } finally {
      set({
        detailLoading: false,
      });
    }
  },

  approve: async (id) => {
    set({
      actionLoading: true,
    });

    try {
      const res =
        await farmService.approve(id);

      await refreshProfileWhenOwnFarm(id);

      return res;
    } finally {
      set({
        actionLoading: false,
      });
    }
  },

  reject: async (id, rejectionReason) => {
    set({
      actionLoading: true,
    });

    try {
      const res =
        await farmService.reject(
          id,
          rejectionReason,
        );

      await refreshProfileWhenOwnFarm(id);

      return res;
    } finally {
      set({
        actionLoading: false,
      });
    }
  },

  suspend: async (id) => {
    set({
      actionLoading: true,
    });

    try {
      const res =
        await farmService.suspend(id);

      await refreshProfileWhenOwnFarm(id);

      return res;
    } finally {
      set({
        actionLoading: false,
      });
    }
  },

  reopen: async (id) => {
    set({
      actionLoading: true,
    });

    try {
      const res =
        await farmService.reopen(id);

      await refreshProfileWhenOwnFarm(id);

      return res;
    } finally {
      set({
        actionLoading: false,
      });
    }
  },

  deleteFarm: async (id) => {
    set({
      actionLoading: true,
    });

    try {
      const res =
        await farmService.delete(id);

      await refreshProfileWhenOwnFarm(id);

      return res;
    } finally {
      set({
        actionLoading: false,
      });
    }
  },

  restore: async (id) => {
    set({
      actionLoading: true,
    });

    try {
      const res =
        await farmService.restore(id);

      await refreshProfileWhenOwnFarm(id);

      return res;
    } finally {
      set({
        actionLoading: false,
      });
    }
  },

  forceDelete: async (id) => {
    set({
      actionLoading: true,
    });

    try {
      const res =
        await farmService.forceDelete(id);

      await refreshProfileWhenOwnFarm(id);

      return res;
    } finally {
      set({
        actionLoading: false,
      });
    }
  },

  clearPublicFarm: () => {
    set({
      publicFarm: null,
    });
  },

  clearMyFarm: () => {
    set({
      myFarm: null,
    });
  },

  clearAdminFarm: () => {
    set({
      farm: null,
    });
  },
}));