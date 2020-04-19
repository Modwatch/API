import { Cursor } from "mongodb";
import { ServerResponse, ServerRequest } from "microrouter";

import { decode, encode } from "jwt-simple";
import bcrypt from "bcrypt-nodejs";
import { promisify } from "util";
import { getProfile } from "./database";

import { FileName } from "@modwatch/types";

const compareAsync = promisify(bcrypt.compare);
const hashAsync = promisify(bcrypt.hash);
const genSaltAsync = promisify(bcrypt.genSalt);

export const supportedFiletypes: FileName[] = [
  "plugins",
  "modlist",
  "ini",
  "prefsini",
];

export const usernameRegex = {
  segmentValueCharset: "a-zA-Z0-9-_~ %@!\\.'\\(\\)\\[\\]",
};

export function validFiletype(filetype: string): boolean {
  //@ts-ignore supportedFiletypes is strings, whatever
  return supportedFiletypes.includes(filetype);
}

export async function generateHash(_password: string): Promise<string> {
  return await hashAsync(_password, await genSaltAsync(8), null);
}

export async function validPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await compareAsync(password, hash);
  } catch (e) {
    return false;
  }
}

export function getToken(req: ServerRequest): string {
  try {
    const bearerHeader = req.headers.authorization;
    if (typeof bearerHeader === "undefined") {
      return undefined;
    }
    const bearer = bearerHeader.split(" ");
    return bearer[1];
  } catch (e) {
    throw {
      httpStatus: 401,
      message: "Invalid Token",
    };
  }
}

export function serialize(query: object): string {
  return Object.keys(query)
    .map(
      (key) => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`
    )
    .join("&");
}

export async function generateToken(
  username: string,
  password: string
): Promise<string> {
  const profile = await getProfile({ username });
  if (!profile) {
    throw {
      httpStatus: 404,
      message: "Profile Not Found",
    };
  }
  if (!(await validPassword(password, profile.password))) {
    throw {
      httpStatus: 401,
      message: "Invalid Login",
    };
  }
  return encode({ username }, process.env.JWTSECRET);
}

export function verifyToken(token: string): any {
  try {
    const decoded = decode(token, process.env.JWTSECRET);
    if (!decoded || !decoded.sub) {
      throw {
        httpStatus: 401,
        message: "Invalid Token",
      };
    }
    return decoded;
  } catch (e) {
    throw {
      httpStatus: 401,
      message: "Invalid Token",
    };
  }
}

exports.serializeStreamToJSONArray = function serializeStreamToJSONArray({
  cursor,
  res,
  serializer,
}: SerializeStreamToJSONParameters): Promise<number> {
  return new Promise((resolve, reject) => {
    res.write("[");
    let first = true;
    let count = 0;
    cursor.on("readable", () => {
      let item = null;
      //@ts-ignore @type def is wrong, read() can take null
      while ((item = cursor.read()) !== null) {
        count++;
        if (!first) {
          res.write(",");
        } else {
          first = false;
        }
        res.write(serializer(item));
      }
    });
    cursor.on("end", () => {
      res.write("]");
      resolve(count);
    });
    cursor.on("error", (e: Error) => {
      throw e;
    });
  });
};

interface SerializeStreamToJSONParameters {
  cursor: Cursor;
  res: ServerResponse;
  serializer(object: any): string;
}
