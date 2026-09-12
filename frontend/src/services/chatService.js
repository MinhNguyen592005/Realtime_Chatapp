import api from "./api";

export const chatService = {
  async getRooms() {
    const response = await api.get("/rooms");
    return response.data;
  },

  async createRoom({ name, type, memberIds }) {
    const response = await api.post("/rooms", { name, type, memberIds });
    return response.data;
  },

  async getRoomDetails(roomId) {
    const response = await api.get(`/rooms/${roomId}`);
    return response.data;
  },

  async getRoomMessages(roomId) {
    const response = await api.get(`/rooms/${roomId}/messages`);
    return response.data;
  },

  async addMember(roomId, userId) {
    const response = await api.post(`/rooms/${roomId}/members`, { userId });
    return response.data;
  },

  async removeMember(roomId, userId) {
    const response = await api.delete(`/rooms/${roomId}/members/${userId}`);
    return response.data;
  },

  async getUsers(query = "") {
    const response = await api.get("/users", {
      params: query ? { query } : {},
    });
    return response.data;
  },
};
