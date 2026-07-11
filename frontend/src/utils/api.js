//src\utils\api.js

import toast from "react-hot-toast";

export async function handleApi(action, onSuccess) {
  try {
    const res = await action();

    if (res?.message) {
      toast.success(res.message);
    }

    onSuccess?.(res);

    return res;
  } catch (e) {
    const errors = e.errors || {};

    const firstError =
      Object.values(errors)[0]?.[0] ||
      e.message ||
      "Có lỗi xảy ra.";

    toast.error(firstError);

    throw e;
  }
}