import { ArrowLeftIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, redirect, useLoaderData, useNavigate } from "react-router";
import type { Route } from "./+types/game-page";
import db from "~/db";
import {
  emoticonsTable,
  gamesEmoticons,
  gamesTable,
  messagesTable,
} from "../schema";
import { eq } from "drizzle-orm";
import useGameAddContext from "./add/game-add-context";
import useGameStartContext, {
  type IEmoticon,
  type IGame,
} from "../home/game-start-context";

const dumiEmoticons = ["꼬우", "네에", "감사합니다", "flex", "hehe"];
const dumiMessages = [
  "안녕하세요",
  "안녕하세요",
  "안녕하세요",
  "안녕하세요",
  "안녕하세요",
];

export async function loader(request: Route.LoaderArgs) {
  const { params } = request;

  const games = await db
    .select({
      id: gamesTable.id,
      name: gamesTable.name,
      emoticon: {
        id: gamesEmoticons.emoticon_id,
        score: gamesEmoticons.score,
        name: emoticonsTable.name,
        image_url: emoticonsTable.image_url,
      },
      message: {
        id: messagesTable.id,
        content: messagesTable.content,
        is_me: messagesTable.is_me,
      },
    })
    .from(gamesTable)
    .where(eq(gamesTable.id, Number(params.id)))
    .innerJoin(gamesEmoticons, eq(gamesEmoticons.game_id, gamesTable.id))
    .innerJoin(
      emoticonsTable,
      eq(emoticonsTable.id, gamesEmoticons.emoticon_id)
    )
    .innerJoin(messagesTable, eq(messagesTable.game_id, gamesTable.id));

  let sortedEmoticons: {
    id: number | null;
    score: unknown;
    name: string;
    image_url: string;
  }[] = [];
  for (const game of games) {
    if (!sortedEmoticons.find((emoticon) => emoticon.id === game.emoticon.id)) {
      sortedEmoticons.push(game.emoticon);
    }
  }
  let sortedMessages: { id: number | null; content: string; is_me: boolean }[] =
    [];
  for (const game of games) {
    if (!sortedMessages.find((message) => message.id === game.message.id)) {
      sortedMessages.push(game.message);
    }
  }
  let sortedGame = {
    id: games[0].id,
    name: games[0].name,
    initEmoticons: sortedEmoticons,
    initMessages: sortedMessages,
  };

  return sortedGame;
}

export default function GamePage({ loaderData }: Route.ComponentProps) {
  const { id, name, initEmoticons, initMessages } = useLoaderData();
  const messagesRef = useRef<HTMLDivElement>(null);
  const emoticonsRef = useRef<HTMLDivElement>(null);
  const [emoticon, setEmoticon] = useState<(typeof initEmoticons)[0]>();
  const [messages, setMessages] = useState<typeof initMessages>(initMessages);
  const { gameIndex, setGameIndex, selectedGames, setSelectedGames } =
    useGameStartContext();
  const navigate = useNavigate();

  function onClickEmoticon(
    e: React.MouseEvent<HTMLImageElement>,
    emoticon: (typeof initEmoticons)[0]
  ) {
    setError("");

    //@ts-ignore
    setSelectedGames((prev: IGame[]) => {
      return prev.map((game: IGame) => {
        if (game.id === id) {
          if (game.emoticon?.id === emoticon.id) {
            return {
              ...game,
              emoticon: null,
            };
          } else {
            return {
              ...game,
              emoticon: {
                id: emoticon.id,
                name: emoticon.name,
                image_url: emoticon.image_url,
                score: emoticon.score,
              },
            };
          }
        } else {
          return game;
        }
      });
    });
  }

  function onClickBack() {
    if (gameIndex === 0) {
      return navigate("/");
    }
    setGameIndex(gameIndex - 1);
    navigate(-1);
  }

  const [error, setError] = useState<string>("");

  function onClickNext() {
    if (!selectedGames[gameIndex].emoticon) {
      setError("이모티콘을 선택해 주세요.");
      return;
    }
    setError("");
    if (gameIndex + 1 === selectedGames.length) {
      return navigate(
        `/game/final?gameIds=${selectedGames
          .map((game) => `${game.emoticon?.id}`)
          .join(",")}`,
        {
          state: { selectedGames },
        }
      );
    }
    setGameIndex(gameIndex + 1);

    navigate(`/game/${selectedGames[gameIndex + 1]?.id}`);
  }

  useEffect(() => {
    const messageElements = messagesRef.current?.childNodes;
    let index = 0;
    messageElements?.forEach((node) => {
      (node as HTMLElement).classList.add("hidden");
    });
    const interval = setInterval(() => {
      if (index === initMessages.length) {
        index = 0;
        clearInterval(interval);
        return;
      }

      (messageElements?.[index] as HTMLElement).classList.remove("hidden");
      (messageElements?.[index] as HTMLElement).classList.add("opacity-100");
      index++;
      messagesRef.current?.scrollTo({
        top: messagesRef.current.scrollHeight,
      });
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [initMessages]);

  useEffect(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
    });
    emoticonsRef.current?.childNodes.forEach((node) => {
      (node as HTMLElement).style.opacity = "1";
    });
  }, [initMessages, initEmoticons, gameIndex, messages]);

  useEffect(() => {
    if (selectedGames.length < 1) {
      navigate("/");
    }
  }, [selectedGames]);

  return (
    <div className="relative bg-[#B2C6D9] max-w-lg w-full max-h-screen h-full flex flex-col overflow-hidden justify-center items-center">
      <div className="absolute top-4 px-4 flex justify-between items-center max-w-lg w-full">
        <button
          onClick={onClickBack}
          className="flex items-center justify-center bg-neutral-500 p-2 text-sm -m-2 rounded-xl text-white"
        >
          <ArrowLeftIcon />
        </button>
        <button
          onClick={onClickNext}
          className="flex items-center justify-center bg-neutral-500 p-2 text-sm -m-2 rounded-xl text-white cursor-pointer"
        >
          다음
        </button>
      </div>
      <div className="absolute flex flex-col items-center justify-center">
        <h1>{name}</h1>
        <p className="text-red-500 text-sm">{error}</p>
      </div>
      <div
        ref={messagesRef}
        className="flex flex-col items-center h-full gap-4 px-2 mt-16 w-full overflow-y-scroll"
        style={{
          scrollbarWidth: "none",
        }}
      >
        {initMessages.map(
          (message: (typeof initMessages)[0], index: number) => {
            const isMe = message?.is_me;
            return (
              <div
                className={`p-2 rounded-xl transition-opacity duration-1000  ${
                  isMe ? "ml-auto bg-[#F8CD58]" : "mr-auto bg-white"
                }`}
                key={index}
              >
                {message?.content}
              </div>
            );
          }
        )}
      </div>
      <div
        ref={emoticonsRef}
        className="flex justify-around w-full bottom-12 mb-8 pt-4"
      >
        {initEmoticons.map(
          (emoticon: (typeof initEmoticons)[0], index: number) => {
            return (
              <img
                key={index}
                onClick={(e) => onClickEmoticon(e, emoticon)}
                className={`w-20 h-20 rounded-full cursor-pointer opacity-0 transition-opacity duration-2000 ${
                  selectedGames[gameIndex]?.emoticon?.id === emoticon.id
                    ? "ring-2 ring-[#F8CD58] shadow-lg shadow-[#F8CD58]"
                    : ""
                }`}
                src={emoticon.image_url}
                alt={emoticon.name}
              />
            );
          }
        )}
      </div>
    </div>
  );
}
