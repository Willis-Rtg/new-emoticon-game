import { createCookieSessionStorage } from "react-router";

export const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    cookie: {
      name: "session-id",
      // httpOnly: true,
      // path: "/",
      // sameSite: "lax",
      // maxAge: 60 * 60 * 24 * 7,
      // secrets: ["secret"],
    },
  });
