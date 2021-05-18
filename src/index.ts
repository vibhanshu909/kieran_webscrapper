import { build } from "./server";

const PORT = 4444;

const start = async () => {
  const server = build();

  try {
    await server.listen(PORT);

    const address = server.server.address();
    const port = typeof address === "string" ? address : address?.port;

    console.log("Listening on port", port);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
