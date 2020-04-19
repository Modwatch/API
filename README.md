### Dependencies

1. [NodeJS/NPM](https://nodejs.org) (Latest Stable Version)
1. [Mongo](https://www.mongodb.com/download-center/community)
  - alternatively, [the docker image](https://hub.docker.com/_/mongo), run script is at the top of `/scripts/clone-database.sh`

### Setup

1. populate a local `.env` file
```ini
DBPASSWORD=password ; should match your mongo instance username
DBUSERNAME=username ; should match your mongo instance password
JWTSECRET=jwtsecret
NODE_ENV=production
DB_HOST=modwatch-db ; or localhost
```
2. `npm ci`
2. `npm run dev`
    - this runs against a mongo instance at `mongo://localhost:27017/modwatch`
    - You will need to populate that database via the uploader or some other means
2. APi is served at http://localhost:3001

### Run

```sh
# build and run using docker, linking to a docker mongo instance named modwatch-db
docker build -t modwatch-api ./
docker run \
  --rm \ # throw away container on exit
  -it \ # show output in interactive terminal
  -p 3001:3001 \ # open port 3001
  --link modwatch-db:modwatch-db \ # link to a container named modwatch-db
  --env-file .env \ # inject variables from a .env file in the cwd
  --name modwatch-api \ # name the container modwatch-api
  modwatch-api # use the image tagged in the previous command
```

```sh
# build (rebuild/restart on change) and run locally (http://localhost:5000)
npm run dev
```

```sh
# build and run (http://localhost:5000)
npm run build
npm start
```

### Tech Stack

- REST(ish)
- [Typescript](https://github.com/microsoft/TypeScript) ([sucrase](https://github.com/alangpierce/sucrase) when developing)
- [Micro](https://github.com/zeit/micro) ([micro-dev](https://github.com/zeit/micro-dev) when developing)
- [Mongodb](https://www.mongodb.com)

### CONTRIBUTING

1. Fork this repo
1. Open an issue for the problem/enhancement you want to work on
1. Create a branch that has to do with the issue you want to fix
1. Implement your changes, most likely in the `/lib` directory
1. make sure `npm run build` completes
1. run `npm run prettier`, preferably in a standalone commit
1. Make a pull request to this repo
1. If there are no merge conflicts, and I've already approved the issue you created, I'll most likely merge your changes

### LINKS

- [Live Site](https://modwat.ch)
- [Live API](https://api.modwat.ch)
- [Nexus Mods Page](http://nexusmods.com/skyrim/mods/56640)
- [API](http://github.com/Modwatch/API)
- [Common Library](http://github.com/Modwatch/Core)
- [Frontend](http://github.com/Modwatch/Frontend)
- [Typescript Models](http://github.com/Modwatch/Types)
- [Uploader](http://github.com/Modwatch/Uploader)
