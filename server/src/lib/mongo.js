import mongoose from "mongoose";

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) return mongoose.connection;

  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/tutormatch";

  mongoose.set("strictQuery", true);

  await mongoose.connect(mongoUri, {
    dbName: undefined,
    autoIndex: true,
  });

  isConnected = true;
  console.log("MongoDB connected:", mongoose.connection.host);
  return mongoose.connection;
}