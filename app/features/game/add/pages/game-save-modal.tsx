import {
  Form,
  Link,
  redirect,
  useActionData,
  useFetcher,
  useNavigate,
  useNavigation,
} from "react-router";
import useGameAddContext, {
  type TEmoticonScore,
  type TMessage,
} from "../game-add-context";
import type { Route } from "./+types/game-save-modal";
import { useState } from "react";
import db from "~/db";
import { gamesEmoticons, gamesTable, messagesTable } from "~/features/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const gameSchema = z.object({
  game_name: z.string().min(1, "게임 이름을 입력해주세요"),
  messages: z.array(z.object({ message: z.string(), is_me: z.boolean() })),
  emoticons: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      image_url: z.string(),
      tags: z.array(z.object({ id: z.number(), name: z.string() })),
      score: z.object({
        친절함: z.number(),
        사회성: z.number(),
        매력적: z.number(),
        센스함: z.number(),
        똑똑함: z.number(),
      }),
    })
  ),
});

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const game_name = formData.get("game_name") as string;
  const messagesJson = formData.get("messages") as string;
  const emoticonsJson = formData.get("emoticons") as string;

  const messages = JSON.parse(messagesJson);
  const emoticons = JSON.parse(emoticonsJson);

  console.log(messages);
  console.log(emoticons);

  const { data, success, error } = gameSchema.safeParse({
    game_name,
    messages,
    emoticons,
  });

  if (!success) {
    return {
      formErrors: error.flatten().fieldErrors,
    };
  }

  console.log(data);

  const existGame = await db
    .select()
    .from(gamesTable)
    .where(eq(gamesTable.name, data.game_name));

  if (existGame.length) {
    return {
      formErrors: {
        game_name: "이미 존재하는 게임 이름입니다",
      },
    };
  }

  const newGame = await db
    .insert(gamesTable)
    .values({ name: data.game_name })
    .returning();

  const newMessages = await db.insert(messagesTable).values(
    data.messages.map((message: TMessage) => ({
      game_id: newGame[0].id,
      content: message.message,
      is_me: message.is_me,
    }))
  );

  const newEmoticons = await db.insert(gamesEmoticons).values(
    data.emoticons.map((emoticon: any) => ({
      game_id: newGame[0].id,
      emoticon_id: emoticon.id,
      score: emoticon.score,
    }))
  );

  return redirect(`/game/${newGame[0].id}`);
}

export default function GameSaveModal() {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const { messages, emoticons, game_name, setGameName } = useGameAddContext();
  const [error, setError] = useState<{ [key: string]: string }>({});
  const actionData = useActionData();

  const navigation = useNavigation();
  const isSubmitting =
    navigation.state === "submitting" || navigation.state === "loading";

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!game_name) {
      setError({ game_name: "게임 이름을 입력해주세요" });
      return;
    }
    if (messages.length < 5) {
      setError({ messages: "메시지가 5개 이상이어야 합니다" });
      return;
    }
    if (emoticons.length < 2) {
      setError({ emoticons: "이모티콘이 2개 이상이어야 합니다" });
      return;
    }
    setError({});

    const body = new FormData();
    body.append("messages", JSON.stringify(messages));
    body.append("emoticons", JSON.stringify(emoticons));
    body.append("game_name", game_name);
    fetcher.submit(body, {
      method: "post",
    });
  };

  return (
    <div
      onClick={() => navigate("/game/add")}
      className="fixed z-10 inset-0 bg-black/20 bg-opacity-50 flex items-center justify-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white p-4 pb-12 min-w-[340px] rounded-lg flex flex-col gap-4 justify-between items-center w-1/3  max-h-7/12 overflow-hidden z-20"
      >
        <fetcher.Form
          onSubmit={onSubmit}
          method="post"
          className="flex flex-col w-full items-center gap-4"
        >
          <h3>게임 저장</h3>
          <input
            type="text"
            name="game_name"
            placeholder="게임 이름을 입력하세요"
            className="w-3/4 p-2  bg-gray-100 rounded-lg"
            value={game_name}
            onChange={(e) => setGameName(e.target.value)}
          />
          <button
            disabled={isSubmitting}
            className="bg-blue-500 text-white  py-2 rounded-lg w-3/4 cursor-pointer"
          >
            {isSubmitting ? "저장 중..." : "저장"}
          </button>
          {error.game_name && (
            <p className="text-red-500 text-xs">{error.game_name}</p>
          )}
          {error.messages && (
            <p className="text-red-500 text-xs">{error.messages}</p>
          )}
          {error.emoticons && (
            <p className="text-red-500 text-xs">{error.emoticons}</p>
          )}
          {actionData?.formErrors?.game_name && (
            <p className="text-red-500 text-xs">
              {actionData.formErrors.game_name}
            </p>
          )}
        </fetcher.Form>
      </div>
    </div>
  );
}
