/**
 * Normalizes an Axios error into a single readable string, whether it's a
 * simple message from the backend, a list of validation errors, or a
 * network failure.
 */
export const getErrorMessage = (error) => {
  if (error?.response?.data?.errors?.length) {
    return error.response.data.errors.map((e) => e.message).join(". ");
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message === "Network Error") {
    return "Can't reach the server. Please check your connection.";
  }
  return "Something went wrong. Please try again.";
};
