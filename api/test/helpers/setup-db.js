import{afterAll, afterEachAll, beforeAll} from "vitest";
import mogoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await  mogoose.connect(mongoServer.getUri())
});


afterEach(async () => {
    const collections = await mogoose.connection.db.collections();
    for (const collection of collections ){
        await collection.deleteMany({});
    }
})

afterAll(async () => {
    await mogoose.disconnect();
    await mongoServer.stop();
});