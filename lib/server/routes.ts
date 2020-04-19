import { get, ServerRequest, ServerResponse } from "microrouter";

import { send } from "micro";

import { routes as users } from "./routes/users";
import { routes as user } from "./routes/user";
import { routes as upload } from "./routes/upload";
import { routes as auth } from "./routes/auth";
import { routes as oauth } from "./routes/oauth";

export const routes = [
  get("/", (req: ServerRequest, res: ServerResponse) => {
    send(res, 200, "Index!");
  }),
  ...users,
  ...user,
  ...upload,
  ...auth,
  ...oauth,
];
