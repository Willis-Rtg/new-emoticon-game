import { useEffect, useRef, useState } from "react";
import { Form, Link, Outlet } from "react-router";
import type { Route } from "./+types/layout";
import { getSession } from "~/session";
import db from "~/db";
import { emoticonsTable } from "../schema";
import { desc, sql } from "drizzle-orm";

const dumiEmoticons = ["꼬우", "네에", "감사합니다", "flex", "hehe"];
const popularEmoticons = ["꼬우", "네에", "감사합니다"];
export interface ILoginModal {
  loginModal: boolean;
  setLoginModal: (modal: boolean) => void;
}

export async function loader({ request }: { request: Request }) {
  const [session, emoticons, popularEmoticons] = await Promise.all([
    getSession(request.headers.get("Cookie")),
    db
      .select({
        id: emoticonsTable.id,
        name: emoticonsTable.name,
        image_url: emoticonsTable.image_url,
      })
      .from(emoticonsTable)
      .orderBy(sql`random()`)
      .limit(20),
    db
      .select({
        id: emoticonsTable.id,
        name: emoticonsTable.name,
        image_url: emoticonsTable.image_url,
      })
      .from(emoticonsTable)
      .orderBy(desc(emoticonsTable.popular))
      .limit(3),
  ]);

  const user = session.get("user");
  return { user, emoticons, popularEmoticons };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { user, emoticons, popularEmoticons } = loaderData;

  async function forward() {
    if (ref.current) {
      ref.current.style.transform = `translateX(-${
        emoticons.length * 168 -
        ref.current.offsetWidth +
        (emoticons.length - 2) * 8
      }px)`;
      await new Promise((resolve) =>
        setTimeout(resolve, emoticons.length * 1000)
      );
      backward();
    }
  }

  async function backward() {
    if (ref.current) {
      ref.current.style.transform = `translateX(0)`;
      await new Promise((resolve) =>
        setTimeout(() => {
          forward();
        }, emoticons.length * 1000)
      );
    }
  }

  useEffect(() => {
    forward();
  }, []);
  return (
    <div className="flex flex-col items-center justify-center gap-4 min-h-0 mb-12 h-[100vh]">
      <h1 className="text-4xl font-bold">이모티콘 게임</h1>
      <div className="relative flex justify-center max-w-lg overflow-x-hidden px-4">
        <div
          ref={ref}
          className={`relative w-full flex gap-4`}
          style={{
            transitionDuration: `${emoticons.length * 1}s`,
            transitionTimingFunction: "linear",
          }}
        >
          {emoticons.map((emoticon, index) => {
            return (
              <img
                key={index}
                className="w-[20vh] h-[20vh] rounded-full"
                src={emoticon.image_url || ""}
                alt={emoticon.name}
              />
            );
          })}
        </div>
      </div>
      <div className="flex flex-col items-center 4 bg-amber-200/30 rounded-4xl p-4">
        <h3> - 인기순위 - </h3>
        <div className="flex items-end gap-4">
          <div className="flex flex-col items-center">
            <img
              className={`w-[16vh] h-[16vh] rounded-full`}
              src={popularEmoticons[2]?.image_url || ""}
              alt={popularEmoticons[2]?.name}
            />
            <span>3등</span>
          </div>
          <div className="flex flex-col items-center">
            <img
              className={`w-[24vh] h-[24vh] rounded-full`}
              src={popularEmoticons[0]?.image_url || ""}
              alt={popularEmoticons[0]?.name}
            />
            <span>1등</span>
          </div>
          <div className="flex flex-col items-center">
            <img
              className={`w-[20vh] h-[20vh] rounded-full`}
              src={popularEmoticons[1]?.image_url || ""}
              alt={popularEmoticons[1]?.name}
            />
            <span>2등</span>
          </div>
        </div>
      </div>

      <div className="flex justify-around w-full">
        <Link
          to="emoticon-upload"
          className="flex items-center justify-center w-28 py-2 bg-[#DFF9FB] rounded-xl text-center"
        >
          이모티콘
          <br />
          업로드
        </Link>

        <Link
          to="start"
          className="flex items-center justify-center w-28 py-2 bg-[#C5EBB1] rounded-xl text-center"
        >
          시작하기
        </Link>

        <Link
          to="game/add"
          className="flex items-center justify-center w-28 py-2 bg-[#F8E7E7] rounded-xl text-center"
        >
          게임 <br />
          만들기
        </Link>
      </div>
      <div>
        {user ? (
          <Link
            to="auth/logout"
            className="px-8 py-2 bg-neutral-500 rounded-lg text-white font-semibold text-sm"
          >
            로그아웃
          </Link>
        ) : (
          <Link
            to="auth"
            className="px-8 py-2 bg-neutral-500 rounded-lg text-white font-semibold text-sm"
          >
            로그인
          </Link>
        )}
        <Outlet />
      </div>
    </div>
  );
}
