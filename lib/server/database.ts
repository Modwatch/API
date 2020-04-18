import { MongoClient, Collection } from "mongodb";

import { generateHash, validPassword, verifyToken } from "./utils";
import sanitize from "mongo-sanitize";

import { Modlist, FileName } from "@modwatch/types";

const client = MongoClient.connect(
  "mongodb://localhost:27017/modwatch",
  {
    useUnifiedTopology: true,
    useNewUrlParser: true
  }
);

export async function getUsersList({
  limit = 50
}: {
  limit?: number;
}): Promise<Partial<Modlist>[]> {
  const modlist = await initializeModlistCollection();
  return modlist
    .find<Modlist>({}, {
      sort: [
        ["timestamp", -1]
      ]
    })
    .project({ username: 1, timestamp: 1, score: 1, _id: 0 })
    .limit(limit)
    .toArray();
}

export async function getUsersCount(): Promise<number> {
  const modlist = await initializeModlistCollection();
  return modlist.estimatedDocumentCount();
}

export async function getProfile({
  username
}: {
  username: string;
}): Promise<Modlist> {
  const modlist = await initializeModlistCollection();
  const result = await modlist.findOne<Modlist>({
    username
  });
  return result;
}

export async function getProfileFiles({ username }: { username: string }): Promise<{
  [key in FileName]?: boolean // FileName
}> {
  const {
    plugins,
    modlist,
    ini,
    prefsini
  } = await (await initializeModlistCollection()).findOne<Modlist>({
    username
  });
  return {
    plugins: !!plugins && plugins.length > 0,
    modlist: !!modlist && modlist.length > 0,
    ini: !!ini && ini.length > 0,
    prefsini: !!prefsini && prefsini.length > 0
  };
}

export async function uploadProfile(profile: Modlist, hash?: string) {
  const modlist = await initializeModlistCollection();
  const exists = await getProfile({ username: profile.username });
  if (!exists) {
    return await modlist.insertOne({
      ...profile,
      password: await generateHash(profile.password)
    });
  } else {
    if (
      (hash && verifyToken(hash)) ||
      !(await validPassword(profile.password, exists.password))
    ) {
      throw {
        httpStatus: 401,
        message: "Invalid Login"
      };
    }
    return await modlist.updateOne(
      {
        username: profile.username
      },
      {
        $set: {
          ...profile,
          password: await generateHash(profile.password)
        }
      }
    );
  }
}

export async function searchProfiles(query, limit = 50): Promise<Modlist[]> {
  const modlist = await initializeModlistCollection();
  return await modlist
    .find({
      username: {
        $regex: `.*${sanitize(query)}.*`,
        $options: "i"
      }
    })
    .project({ username: 1, timestamp: 1, score: 1, game: 1, _id: 0 })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
}

export async function deleteProfile(
  username: string,
  password: string,
  adminToken?: string
) {
  const modlist = await initializeModlistCollection();
  const exists = await getProfile({ username });
  if (!exists) {
    throw {
      httpStatus: 404,
      message: "Username not found"
    };
  }
  if (!adminToken) {
    if (!(await validPassword(password, exists.password))) {
      throw {
        httpStatus: 401,
        message: "Invalid Login"
      };
    }
  } else {
    const token = await verifyToken(adminToken);
    if (
      (!token || !token.scopes || !token.scopes.includes("admin")) &&
      !(await validPassword(password, exists.password))
    ) {
      throw {
        httpStatus: 401,
        message: "Insufficient Permissions"
      };
    }
  }
  return await modlist.deleteOne({
    username
  });
}

export async function changePass(username, oldpass, newpass) {
  const modlist = await initializeModlistCollection();
  const exists = await getProfile({ username });
  if (!exists) {
    throw {
      httpStatus: 404,
      message: "Username not found"
    };
  }
  if (!(await validPassword(oldpass, exists.password))) {
    throw {
      httpStatus: 401,
      message: "Invalid Login"
    };
  }
  return await modlist.updateOne(
    {
      username
    },
    {
      $set: {
        password: await generateHash(newpass)
      }
    }
  );
}

export async function initializeModlistCollection(): Promise<Collection> {
  return (await client).db("modwatch").collection("modlist");
}
