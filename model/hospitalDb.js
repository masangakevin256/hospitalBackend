const { MongoClient } = require("mongodb");
const uri = process.env.HOSPITAL_DATABASE;

let dbConnection;

module.exports = {
  connectToDb: (cb) => {
    const client = new MongoClient(uri);

    client
      .connect()
      .then(() => {
        dbConnection = client.db();  
        console.log("Connected to hospital database");
        return cb();
      })
      .catch((err) => {
        console.error(" MongoDB connection error:", err);
        return cb(err);
      });
  },

  getDb: () => dbConnection,
};