import { get, ServerRequest, ServerResponse } from "microrouter";
import { send } from "micro";
import UrlPattern from "url-pattern";
import zlib from "zlib";

import { getUsersCount, getUsersList, searchProfiles, getUsersStream } from "../database";
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
    "/api/users/stream(/:limit)",
    async (req: ServerRequest, res: ServerResponse) => {
      if (
        typeof req.params.limit !== "undefined" &&
        !Number.isInteger(+req.params.limit)
      ) {
        send(res, 400, "Invalid Limit");
        return;
      }
      try {
        const users = await getUsersStream({
          limit:
            typeof req.params.limit !== "undefined"
              ? +req.params.limit
              : undefined,
        });
        let buffer = [], index = 0, chunkFlushCallback, first = true;
        res.setHeader("Content-Type", "application/json");
        res.setHeader('Content-Encoding', 'gzip');
        for await(const chunk of users) {
          if(index++ !== 100) {
            buffer.push(chunk);
          } else {
            index = 0;
            await chunkFlushCallback;
            chunkFlushCallback = gzipChunk({ res, buffer, first });
            first = false;
            buffer = [];
          }
        }
        await chunkFlushCallback;
        if(buffer.length > 0) {
          console.log("legtn > 0")
          await gzipChunk({ res, buffer, last: true });
        } else {
          await gzipChunk({ res, buffer: [], last: true });
        }
        console.log("end");
        res.end("]");
        // const status: number = await new Promise((resolve, reject) => {
        //   let first = true;
        //   res.setHeader("Content-Type", "application/json");
        //   res.write("[");
        //   users.on("data", data => {
        //     if(!first) {
        //       res.write(`,${JSON.stringify(data)}`);
        //     } else {
        //       first = false;
        //       res.write(JSON.stringify(data));
        //     }
        //   });
        //   users.on("end", () => {
        //     console.log("end");
        //     res.write("]");
        //     resolve(200);
        //   });
        //   users.on("error", e => {
        //     console.log("error");
        //     reject(e);
        //   });
        // });
        // send(res, status);
        // send(res, 200, users);
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

interface gzipChunkParams {
  res,
  buffer: any[],
  first?: boolean,
  last?: boolean
}
async function gzipChunk({
  res,
  buffer,
  first,
  last
}: gzipChunkParams) {
  return new Promise((resolve, reject) => {
    zlib.gzip(Buffer.from(`${!first ? "," : ""}${JSON.stringify(buffer).slice(!first ? 1 : 0, !last ? -1 : undefined)}`, "utf-8"), (err, result) => {
      if(err) {
        console.log(err);
        reject(err);
      } else {
        res.write(result);
        resolve(result);
      }
    });
  });
}