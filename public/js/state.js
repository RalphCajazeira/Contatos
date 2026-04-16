export const state = {
  users: [],
  availableEmails: [],
  availablePhones: [],
  currentFilter: "active", // active | inactive | all
  summary: {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    availableEmails: 0,
    availablePhones: 0,
    emailsInUse: 0,
    phonesInUse: 0,
  },
}
