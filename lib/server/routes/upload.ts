import { post, ServerRequest, ServerResponse } from "microrouter";
import { send, json } from "micro";

import { uploadProfile } from "../database";
import { getToken } from "../utils";

import { Modlist } from "@modwatch/types";

export const routes = [
  post("/loadorder", async (req: ServerRequest, res: ServerResponse) => {
    try {
      const body = (await json(req)) as Modlist;
      const profile = {
        ...body,
        timestamp: new Date(),
      };
      send(res, 201, await uploadProfile(profile, getToken(req)));
    } catch (e) {
      console.log(e);
      send(res, e.httpStatus || 500, e.message || null);
    }
  }),
];
