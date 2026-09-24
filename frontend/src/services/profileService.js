import api from "./api";

export const profileService = {
  async getProfile(userId, currentUserId) {
    const path = userId === currentUserId ? "/users/me/profile" : `/users/${userId}/profile`;
    const response = await api.get(path);
    return response.data;
  },

  async updateMyProfile(profile) {
    const response = await api.patch("/users/me/profile", profile);
    return response.data;
  },
};
