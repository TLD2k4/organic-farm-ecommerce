// src/store/authStore.js

import { create } from "zustand";

import authService from "../services/authService";

const storedToken =
  localStorage.getItem("access_token");

/*
 * Dùng chung một Promise khi nhiều component
 * gọi getProfile cùng lúc.
 */
let profileRequest = null;

export const useAuthStore = create(
  (set, get) => ({
    user: null,

    token: storedToken,

    loading: false,

    initialLoading: Boolean(storedToken),

    login: async (payload) => {
      set({
        loading: true,
      });

      try {
        const res =
          await authService.login(payload);

        const accessToken =
          res?.data?.access_token;

        const user =
          res?.data?.user ?? null;

        if (!accessToken) {
          throw new Error(
            "Phản hồi đăng nhập không có access token.",
          );
        }

        localStorage.setItem(
          "access_token",
          accessToken,
        );

        set({
          token: accessToken,
          user,
          initialLoading: false,
        });

        return res;
      } finally {
        set({
          loading: false,
        });
      }
    },

    register: async (payload) => {
      set({
        loading: true,
      });

      try {
        const res =
          await authService.register(payload);

        const accessToken =
          res?.data?.access_token;

        const user =
          res?.data?.user ?? null;

        if (!accessToken) {
          throw new Error(
            "Phản hồi đăng ký không có access token.",
          );
        }

        localStorage.setItem(
          "access_token",
          accessToken,
        );

        set({
          token: accessToken,
          user,
          initialLoading: false,
        });

        return res;
      } finally {
        set({
          loading: false,
        });
      }
    },

    getProfile: async () => {
      /*
       * Nếu request profile đang chạy,
       * trả lại request cũ thay vì gọi API lần nữa.
       */
      if (profileRequest) {
        return profileRequest;
      }

      const tokenAtStart =
        get().token;

      profileRequest = authService
        .profile()

        .then((res) => {
          /*
           * Chỉ cập nhật khi token vẫn còn giống
           * token lúc bắt đầu request.
           */
          if (
            tokenAtStart &&
            get().token === tokenAtStart
          ) {
            set({
              user: res?.data ?? null,
              initialLoading: false,
            });
          }

          return res;
        })

        .catch((error) => {
          set({
            initialLoading: false,
          });

          throw error;
        })

        .finally(() => {
          profileRequest = null;
        });

      return profileRequest;
    },

    changePassword: async (payload) => {
      return authService.changePassword(
        payload,
      );
    },

    logout: async () => {
      try {
        await authService.logout();
      } catch (error) {
        console.error(
          "LOGOUT ERROR:",
          error,
        );
      }

      profileRequest = null;

      localStorage.removeItem(
        "access_token",
      );

      set({
        token: null,
        user: null,
        initialLoading: false,
      });
    },

    logoutAll: async () => {
      try {
        await authService.logoutAll();
      } catch (error) {
        console.error(
          "LOGOUT ALL ERROR:",
          error,
        );
      }

      profileRequest = null;

      localStorage.removeItem(
        "access_token",
      );

      set({
        token: null,
        user: null,
        initialLoading: false,
      });
    },
  }),
);