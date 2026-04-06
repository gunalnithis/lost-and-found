const parseStoredObject = (key) => {
  const rawValue = localStorage.getItem(key);
  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
};

export const getUserToken = () => {
  const adminInfo = parseStoredObject("adminInfo");
  const userInfo = parseStoredObject("userInfo");

  const adminToken = adminInfo?.token;
  if (adminToken) {
    return adminToken;
  }

  const userToken = userInfo?.token;
  const isAdminUser = userInfo?.isAdmin === true;
  if (userToken && isAdminUser) {
    return userToken;
  }

  if (userToken && userInfo?.isAdmin === false) {
    throw new Error("Admin access required. Please login with an admin account.");
  }

  throw new Error("Please login first. Authentication token is missing.");
};

export const getAuthHeaders = (extraHeaders = {}) => {
  const token = getUserToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...extraHeaders,
  };
};
