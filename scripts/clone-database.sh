#!/bin/bash

# docker run -d --rm -it -p 27017:27017 --name modwatch-db -e MONGO_INITDB_USERNAME=username -e MONGO_INITDB_PASSWORD=password mongo:3
echo "Assuming you're in the modwatch/api directory..."
echo "Assuming a mongo container is already running with --name=modwatch-db"
ssh -p22 api.modwat.ch "mongodump --db modwatch --gzip --archive=./db-dump/"
rsync --remove-source-files -avz api.modwat.ch:./db-dump/archive.gz ./
echo "dump is moved to ./archive.gz"
docker exec -i modwatch-db sh -c 'mongorestore --drop --gzip --archive' < ./archive.gz
docker exec -it modwatch-db mongo --eval 'db.modlist.updateMany({"username":{"$ne": "Peanut"}},{$set:{"password":"removed"}})' modwatch