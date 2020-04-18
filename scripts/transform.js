const { initializeModlistCollection, getUsersList } = require("./dist/server/database");

(async () => {


    const modlist = await initializeModlistCollection();
    const results = (await modlist
        .find({
            timestamp: {
                $type: "string"
            }
        }, {
            sort: [
              ["timestamp", -1]
            ]
          })
        .project({ username: 1, timestamp: 1 })
        .toArray())
        .map(modl => ({
            ...modl,
            newTimestamp: new Date(modl.timestamp)
        }))
        // .slice(0, 1);
    
    for(const modl of results) {
        console.log(`updating ${modl.username} from ${modl.timestamp} to ${modl.newTimestamp}...`);
        try {
            await modlist.updateOne({
                username: modl.username
            }, {
                $set: {
                    timestamp: modl.newTimestamp
                    // oldTimestamp: modl.timestamp
                }
            })
            console.log("It worked!");
        } catch (e) {
            console.log("it failed!");
            console.log(e);
        }
    }

    console.log(`updated ${results.length} modlists`);

    process.exit(0);

})();