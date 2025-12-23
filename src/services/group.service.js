import apiClient from './api'

export const groupService = {
  getGroups: async (params) => {
    const response = await apiClient.get('/admin/groups', {
      params,
    })
    return response.data
  },

  getGroupById: async (id) => {
    const response = await apiClient.get(`/admin/groups/${id}`)
    return response.data.data
  },

  updateGroup: async (id, data) => {
    const response = await apiClient.put(`/admin/groups/${id}`, data)
    return response.data.data
  },

  deleteGroup: async (id) => {
    await apiClient.delete(`/admin/groups/${id}`)
  },

  addMember: async (groupId, userId) => {
    const response = await apiClient.post(`/admin/groups/${groupId}/members`, { userId })
    return response.data
  },

  removeMember: async (groupId, userId) => {
    await apiClient.delete(`/admin/groups/${groupId}/members`, { data: { userId } })
  },
}
