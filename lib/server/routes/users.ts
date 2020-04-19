import { get, ServerRequest, ServerResponse } from "microrouter";
import { send } from "micro";
import UrlPattern from "url-pattern";

import { getUsersCount, getUsersList, searchProfiles } from "../database";
import { usernameRegex } from "../utils";

export const routes = [
  get("/api/users/count", async (req: ServerRequest, res: ServerResponse) => {
    try {
      send(res, 200, await getUsersCount());
    } catch (e) {
      send(res, 500);
    }
  }),
  get(
    "/api/users/list(/:limit)",
    async (req: ServerRequest, res: ServerResponse) => {
      if (
        typeof req.params.limit !== "undefined" &&
        !Number.isInteger(+req.params.limit)
      ) {
        send(res, 400, "Invalid Limit");
        return;
      }
      try {
        const users = await getUsersList({
          limit:
            typeof req.params.limit !== "undefined"
              ? +req.params.limit
              : undefined,
        });
        send(res, 200, users);
      } catch (e) {
        send(res, 500);
      }
    }
  ),
  get(
    //@ts-ignore UrlPattern is allowed as a parameter to micro-router methods
    new UrlPattern("/api/search/users/:query/:limit", usernameRegex),
    async (req: ServerRequest, res: ServerResponse) => {
      const users = await searchProfiles(
        decodeURIComponent(req.params.query),
        req.params.limit ? +req.params.limit : undefined
      );
      send(res, 200, users);
    }
  ),
];
