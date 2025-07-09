import { useEffect, useRef, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  Legend,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { Route } from "./+types/game-final-page";
import db from "~/db";
import { emoticonsTable, gamesEmoticons } from "~/features/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { useLocation, useNavigate } from "react-router";
import useGameStartContext, {
  type IGame,
} from "~/features/home/game-start-context";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const parsedGameIds = url.searchParams.get("gameIds")?.split(",");

  const gameIds = parsedGameIds?.map((id) => Number(id));

  await db
    .update(emoticonsTable)
    .set({ popular: sql`emoticons.popular + 1` })
    .where(inArray(emoticonsTable.id, gameIds!));

  return null;
}

export default function GameFinalPage({ loaderData }: Route.ComponentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { state } = useLocation();
  const { selectedGames } = useGameStartContext();

  async function forward() {
    if (ref.current) {
      ref.current.style.transform = `translateX(-${
        state.selectedGames.length * 168 -
        ref.current.offsetWidth +
        (state.selectedGames.length - 2) * 8
      }px)`;
      await new Promise((resolve) =>
        setTimeout(resolve, state.selectedGames.length * 1000)
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
        }, state.selectedGames.length * 1000)
      );
    }
  }

  useEffect(() => {
    if (selectedGames.length === 0) {
      navigate("/");
      return;
    }
    forward();
  }, [selectedGames]);

  const allGameScore = {
    친절함: 0,
    사회성: 0,
    매력적: 0,
    센스함: 0,
    똑똑함: 0,
  };
  for (const game of selectedGames) {
    allGameScore.친절함 += game.emoticon?.score.친절함 || 0;
    allGameScore.사회성 += game.emoticon?.score.사회성 || 0;
    allGameScore.매력적 += game.emoticon?.score.매력적 || 0;
    allGameScore.센스함 += game.emoticon?.score.센스함 || 0;
    allGameScore.똑똑함 += game.emoticon?.score.똑똑함 || 0;
  }

  const data = [
    {
      subject: "친절함",
      A: allGameScore.친절함,
      fullMark: selectedGames.length,
    },
    {
      subject: "사회성",
      A: allGameScore.사회성,
      fullMark: selectedGames.length,
    },
    {
      subject: "매력적",
      A: allGameScore.매력적,
      fullMark: selectedGames.length,
    },
    {
      subject: "센스함",
      A: allGameScore.센스함,
      fullMark: selectedGames.length,
    },
    {
      subject: "똑똑함",
      A: allGameScore.똑똑함,
      fullMark: selectedGames.length,
    },
  ];

  return (
    <div className="flex flex-col gap-8 justify-center items-center">
      <div className="relative flex flex-col items-center justify-center gap-4 max-w-lg overflow-x-hidden px-4">
        <h3 className="text-2xl font-bold">선택한 이모티콘</h3>
        <div
          ref={ref}
          className={`relative w-full flex gap-4`}
          style={{
            transitionDuration: `${state.selectedGames.length * 1}s`,
            transitionTimingFunction: "linear",
          }}
        >
          {state.selectedGames.map((game: IGame, index: number) => {
            return (
              <img
                key={index}
                className="w-40 h-40 rounded-full"
                src={game.emoticon?.image_url || ""}
                alt={game.emoticon?.name || ""}
              />
            );
          })}
        </div>
      </div>
      <div className="w-80 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            // className="w-20 h-20"
            // style={{ width: 100, innerHeight: 100, outerHeight: 100 }}
            data={data}
          >
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={30} domain={[0, 3]} />
            <Radar
              name="포인트"
              dataKey="A"
              stroke="#F8CD58"
              fill="#F8CD58"
              fillOpacity={0.6}
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <button
        className="bg-[#f0d1db] py-2 px-4 rounded-lg"
        onClick={() => navigate("/")}
      >
        홈으로
      </button>
    </div>
  );
}
