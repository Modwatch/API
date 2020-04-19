import { post, del, get, ServerRequest, ServerResponse } from "microrouter";
import { send } from "micro";
import parse from "urlencoded-body-parser";
import UrlPattern from "url-pattern";
import { join } from "path";
import { renderFile } from "ejs";
import { promisify } from "util";
import { encode } from "jwt-simple";

import {
  getToken,
  serialize,
  verifyToken,
  validPassword,
  usernameRegex,
} from "../utils";
import { getProfile, deleteProfile } from "../database";

const renderFileAsync = promisify(renderFile);

const clients =
  process.env.NODE_ENV === "production"
    ? ["https://modwat.ch", "https://modwatch-staging.firebaseapp.com"]
    : ["http://localhost:5000"];

export const routes = [
  get("/oauth/authorize", async (req: ServerRequest, res: ServerResponse) => {
    send(
      res,
      200,
      await renderFileAsync(join(__dirname, "..", "oauth.ejs"), {
        params: req.query,
        querystring: serialize(req.query),
      })
    );
  }),
  get("/oauth/verify", async (req: ServerRequest, res: ServerResponse) => {
    try {
      const token = await verifyToken(await getToken(req));
      if (new Date() > new Date(token.exp)) {
        send(res, 401, "Invalid Token");
        return;
      }
      send(res, 200);
    } catch (e) {
      send(res, e.httpStatus || 500, e.message || null);
    }
  }),
  post("/oauth/authorize", async (req: ServerRequest, res: ServerResponse) => {
    const query = serialize(req.query);
    try {
      const body = (await parse(req)) as Modwatch.Profile;
      const scopes = body.scopes || [];
      if (clients.every((c) => req.query.redirect_uri.indexOf(c) !== 0)) {
        res.statusCode = 301;
        res.setHeader(
          "Location",
          `/oauth/authorize?${query}&failed=${encodeURIComponent(
            "Login must be initiated from a valid client"
          )}`
        );
        res.end();
        return;
      }
      if (["username", "password"].filter((q) => !!body[q]).length !== 2) {
        res.statusCode = 301;
        res.setHeader(
          "Location",
          `/oauth/authorize?${query}&failed=${encodeURIComponent(
            "Username/Password/Scope Required"
          )}`
        );
        res.end();
        return;
      }
      const profile = await getProfile({ username: body.username });
      if (!profile) {
        throw {
          httpStatus: 404,
          message: "Profile Not Found",
        };
      }
      const roles = profile.roles ? [].concat(profile.roles).sort() : [];
      if (
        !(await validPassword(body.password, profile.password)) ||
        ![]
          .concat(scopes)
          .sort()
          .every((scope, index) => scope === roles[index])
      ) {
        res.statusCode = 301;
        res.setHeader(
          "Location",
          `/oauth/authorize?${query}&failed=${encodeURIComponent(
            "Invalid Credentials"
          )}`
        );
        res.end();
        return;
      }
      const iat = new Date().getTime();
      const token = {
        iss: req.query.redirect_uri,
        aud: "https://api.modwat.ch/",
        sub: profile.username,
        iat,
        exp: iat + 3600 * 1000,
        scopes: [...new Set(["user"].concat(scopes).concat(roles))],
      };
      res.statusCode = 301;
      res.setHeader(
        "Location",
        `${decodeURIComponent(
          req.query.redirect_uri
        )}oauth/access_token/${encodeURIComponent(
          encode(token, process.env.JWTSECRET)
        )}/token_type/Bearer/expires_in/3600`
      );
      res.end();
    } catch (e) {
      console.log(e);
      res.statusCode = 301;
      res.setHeader(
        "Location",
        `/oauth/authorize?${query}&failed=${encodeURIComponent(
          "Invalid Credentials"
        )}`
      );
      res.end();
    }
  }),
  del(
    //@ts-ignore UrlPattern is allowed as a parameter to micro-router methods
    new UrlPattern("/oauth/user/:username/delete", usernameRegex),
    async (req: ServerRequest, res: ServerResponse) => {
      try {
        const token = await verifyToken(await getToken(req));
        if (
          decodeURIComponent(req.params.username) !== token.sub &&
          !token.scopes.includes("admin")
        ) {
          send(res, 401);
          return;
        }
        const profile = await getProfile({
          username: decodeURIComponent(req.params.username),
        });
        if (!profile) {
          throw {
            httpStatus: 404,
            message: "Profile Not Found",
          };
        }
        if (profile.roles.includes("admin")) {
          send(res, 401);
          return;
        }
        await deleteProfile(
          decodeURIComponent(req.params.username),
          null,
          token
        );
        send(res, 200);
      } catch (e) {
        console.log(e);
        send(res, e.httpStatus || 500, e.message || null);
      }
    }
  ),
];
