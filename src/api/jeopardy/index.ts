import api from "@/api/axios";

const BASE_URL = "/api/game/game-type/jeopardy";

export const jeopardyApi = {
  // [POST] Create Game
  create: async (formData: FormData) => {
    return await api.post(BASE_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // [GET] Get Detail (For Editor - usually contains game_json wrapper)
  getDetail: async (id: string) => {
    return await api.get(`${BASE_URL}/${id}`);
  },

  // [GET] Play (For Board - usually returns flat settings/rounds)
  play: async (id: string) => {
    // Try public first, you might need to handle private if user is creator
    return await api.get(`${BASE_URL}/${id}/play/public`);
  },

  // [POST] Play Count (For Exit Button)
  submitPlayCount: async (id: string) => {
    return await api.post(`/api/game/play-count`, { game_id: id });
  },

  endGame: (id: string) => api.post(`/api/game/game-type/jeopardy/${id}/end`),
};
