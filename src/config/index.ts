export const config = {
  session: {
    softDelete: true,
  },
  verifyEmail: {
    expiry: 1000 * 60 * 3, // 3 minutes
  },
};
