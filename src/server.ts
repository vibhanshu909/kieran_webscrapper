import { Type } from "@sinclair/typebox";
import Fastify, { FastifyInstance, RouteShorthandOptions } from "fastify";
import { bandcampScrapper } from "./bandcamp";
import { bigCartelScrapper } from "./bigCartel";
import { depopScrapper } from "./depop";
import { Product, ProductType } from "./types";

export const build = () => {
  const server: FastifyInstance = Fastify({});

  const opts: RouteShorthandOptions = {
    schema: {
      body: Type.String(),
      response: {
        200: Type.Array(Product),
      },
    },
  };

  const handlerMap: Record<
    string,
    (id: string) => Promise<Partial<ProductType>[]>
  > = {
    "/bandcamp": bandcampScrapper,
    "/depop": depopScrapper,
    "/bigcartel": bigCartelScrapper,
  };

  server.get(
    "/status",
    {
      schema: {
        response: {
          200: {
            date: Type.String(),
            works: Type.Boolean(),
          },
        },
      },
    },
    async (req, rep) => {
      rep.status(200).send({ date: new Date().toDateString(), works: true });
    }
  );

  Object.entries(handlerMap).forEach(([route, handler]) => {
    server.get<{ Body: string; Response: ProductType[] }>(
      route,
      opts,
      async (req, rep) => {
        const { id } = req.query as any;
        const data = await handler(id);
        rep.status(200).send(data);
      }
    );
  });

  return server;
};
