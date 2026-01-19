export function redirectWithError(message, res, eventId) {
  return res
    .status(404)
    .redirect(
      `/admin/student-registrations/${eventId}?error=${encodeURIComponent(
        message
      )}`
    );
}
export function redirectWithSuccess(message, res, eventId) {
  return res
    .status(200)
    .redirect(
      `/admin/student-registrations/${eventId}?success=${encodeURIComponent(
        message
      )}`
    );
}
