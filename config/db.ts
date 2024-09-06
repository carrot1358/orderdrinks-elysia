import * as mongoose from "mongoose";
import * as pc from "picocolors";

export const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      if (Bun.env.MONGO_URI !== undefined) {
        const conn = await mongoose.connect(Bun.env.MONGO_URI, {
          autoIndex: true,
          serverSelectionTimeoutMS: 5000,
        });

        console.log(
          pc.cyan(
            `Success: MongoDB Connected: ${conn.connection.host}:${conn.connection.port} - [${conn.connection.name}]`
          )
        );
        return;
      }
    } catch (err: any) {
      console.error(pc.red(`Error: ${err.message}`));
      retries++;
      if (retries >= maxRetries) {
        console.error(
          pc.red(`Failed to connect to MongoDB after ${maxRetries} attempts`)
        );
        process.exit(1);
      }
      console.log(
        pc.yellow(`Retrying in 5 seconds... (Attempt ${retries}/${maxRetries})`)
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};
