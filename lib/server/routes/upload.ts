import { post, ServerRequest, ServerResponse } from "microrouter";
import { send, json } from "micro";

import { uploadProfile } from "../database";
import { getToken } from "../utils";

export const routes = [
  post("/loadorder", async (req: ServerRequest, res: ServerResponse) => {
    try {
      const body = (await json(req)) as Modwatch.Profile;
      const profile = {
        ...body,
        timestamp: Date.now()
      };
      send(res, 201, await uploadProfile(profile, getToken(req)));
    } catch (e) {
      console.log(e);
      send(res, e.httpStatus || 500, e.message || null);
    }
  })
];
