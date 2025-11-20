const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length > 0
    ? process.env.ADMIN_PASSWORD
    : "Жопа";

export function verifyAdminPassword(input: string) {
  return input === ADMIN_PASSWORD;
}

