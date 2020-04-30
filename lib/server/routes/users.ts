import { get, ServerRequest, ServerResponse } from "microrouter";
import { send } from "micro";
import UrlPattern from "url-pattern";
import zlib from "zlib";
import { pipeline } from "stream";
import through2 from "through2";

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

        let buffer = [];

        const transform = through2({
          objectMode: true
        }, function transform(chonk, enc, cb) {
          buffer.push(chonk)
          if(buffer.length === 5) {
            cb(null, Buffer.from(JSON.stringify(buffer)));
            buffer = [];
          } else {
            cb();
          }
        });

        const log = through2({
          objectMode: true
        }, function transform(chonk, enc, cb) {
          console.log(chonk.toString());
          cb(null, chonk);
        });

        // res.on("error", console.log);
        // res.on("data", console.log);

        const gzip = zlib.createGzip();
        res.setHeader("Content-Type", "application/json");
        res.setHeader('Content-Encoding', 'chunked');
        pipeline(
          users,
          transform,
          // log,
          res,
          (err) => {
            if (err) {
              console.error('Pipeline failed.', err);
            } else {
              console.log('Pipeline succeeded.');
            }
          }
        );

        /* WORKING, NO GZIP*/
        // let buffer = [], first = true;
        // res.setHeader("Content-Type", "application/json");
        // // res.setHeader('Content-Encoding', 'gzip, chunked');
        // for await(const chunk of users) {
        //   buffer.push(chunk);
        //   if(buffer.length !== 100) {
        //   } else {
        //     // await chunkFlushCallback;
        //     // chunkFlushCallback = gzipChunk({ res, buffer, first });
        //     res.write(streamChunks({ buffer, first }));
        //     first = false;
        //     buffer = [];
        //   }
        // }
        // // await chunkFlushCallback;
        // if(buffer.length > 0) {
        //   console.log("legtn > 0")
        //   // await gzipChunk({ res, buffer, last: true });
        //   res.write(streamChunks({ buffer, first, last: true }));
        // } else {
        //   // await gzipChunk({ res, buffer: [], last: true });
        //   res.write(streamChunks({ buffer: [], first, last: true }))
        // }
        // res.end();

        /*OLD SHITTY*/
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
async function streamGzipChunks({
  res,
  buffer,
  first,
  last
}: gzipChunkParams) {
  return new Promise((resolve, reject) => {
    zlib.gzip(streamChunks({ buffer, first, last }), (err, result) => {
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
interface streamChunksParams {
  buffer: any[],
  first?: boolean,
  last?: boolean
}
function streamChunks({
  buffer,
  first,
  last
}: streamChunksParams) {
  return Buffer.from(`${!first ? "," : ""}${JSON.stringify(buffer).slice(!first ? 1 : 0, !last ? -1 : undefined)}`, "utf-8");
}