export const config = ({
  username,
  password,
  env
}: {
  username: string;
  password: string;
  env: string;
}) =>
  env === "production"
    ? `mongodb://${username}:${password}@localhost:27017/modwatch`
    : "mongodb://localhost:27017/modwatch";
