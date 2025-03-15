import { Elysia } from "elysia";
import { news, youtube } from "./index";

new Elysia()
  .get("/news", async () => {
    await news();
    return { success: true, message: "News processing started" };
  })
  .get("/youtube", async () => {
    await youtube();
    return { success: true, message: "YouTube processing started" };
  })
  .listen(3000);
