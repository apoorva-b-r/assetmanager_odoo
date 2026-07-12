const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function request(path, options = {}) {
  const { method = "GET", body, headers = {}, ...rest } = options;

  const config = {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...rest,
  };

  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, config);
  } catch (networkErr) {
    // fetch itself failed — network down, CORS, server unreachable, etc.
    throw {
      code: "NETWORK_ERROR",
      message: "Unable to reach the server. Check your connection and try again.",
      status: 0,
    };
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    // response wasn't JSON (e.g. server crashed with an HTML error page)
    throw {
      code: "INVALID_RESPONSE",
      message: "Server returned an unexpected response.",
      status: response.status,
    };
  }

  if (!response.ok || payload.success === false) {
    throw {
      code: payload.code || "UNKNOWN_ERROR",
      message: payload.message || "Something went wrong.",
      status: response.status,
      data: payload.data,
    };
  }

  return payload.data;
}

export const apiClient = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body }),
  put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};
