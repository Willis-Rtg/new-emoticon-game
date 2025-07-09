import { useEffect, useState } from "react";
import { Form, useNavigate } from "react-router";
import TagComponent from "~/common/components/tag-component";
import { baseColors } from "~/common/constants";
import type { Route } from "./+types/start-modal";
import db from "~/db";
import { gamesTable } from "~/features/schema";
import useGameStartContext, { type IGame } from "../game-start-context";

const dumiGames = [
  "감사합니다",
  "여행이닷",
  "여행이닷2",
  "훌룰랄라",
  "와요",
  "가요",
  "회의1",
  "회의2",
  "빈가워요",
  "안녕",
  "안녕2",
  "처음봐",
  "반가워",
];

export async function loader(request: Route.LoaderArgs) {
  const games = await db
    .select({
      id: gamesTable.id,
      name: gamesTable.name,
    })
    .from(gamesTable);

  return { games };
}

export default function StartModal({ loaderData }: Route.ComponentProps) {
  const [startError, setStartError] = useState<string>("");
  const navigate = useNavigate();
  const { gameIndex, selectedGames, setGameIndex, setSelectedGames } =
    useGameStartContext();

  const { games } = loaderData;
  function onClickGames(game: IGame) {
    if (selectedGames.includes(game)) {
      //@ts-ignore
      setSelectedGames((prev: IGame[]) =>
        prev.filter((item) => item.id !== game.id)
      );
    } else {
      //@ts-ignore
      setSelectedGames((prev: IGame[]) => [...prev, game]);
    }
  }

  function onClickStart() {
    if (selectedGames.length < 3) {
      return setStartError("게임 수는 3이상이어야 합니다.");
    }
    navigate(`/game/${selectedGames[0].id}`);
  }

  useEffect(() => {
    setSelectedGames([]);
    setGameIndex(0);
  }, []);

  return (
    <div
      onClick={() => navigate("/")}
      className="fixed inset-0 bg-black/20 bg-opacity-50 flex items-center justify-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white p-8 pb-12 min-w-[380px] max-h-[58vh] rounded-lg flex flex-col gap-4 items-center w-1/3"
      >
        <h2 className="text-lg font-bold">게임 시작</h2>
        <Form className="flex flex-col p-8 gap-4 justify-center max-h-[36vh] items-center bg-neutral-300 rounded-2xl ">
          <label>
            게임 수 :
            <input
              className="ml-1 bg-white rounded-2xl outline-none p-1 pl-4 w-16 text-center"
              type="number"
              value={selectedGames.length}
              onChange={(e) => {
                if (Number(e.target.value) < 3) {
                  setStartError("게임 수는 3이상이어야 합니다.");
                }
              }}
            />
          </label>
          <div
            className="flex flex-wrap gap-2 justify-center items-center overflow-auto py-1 "
            style={{ scrollbarWidth: "none" }}
          >
            {games.map((game, index) => (
              <TagComponent
                key={index}
                onClick={() => onClickGames(game)}
                className={`cursor-pointer ${
                  selectedGames.includes(game)
                    ? "ring-2 ring-black"
                    : "opacity-50"
                }`}
                tag={game.name}
                style={{ backgroundColor: baseColors[index % 5] }}
              />
            ))}
          </div>
        </Form>
        <button
          onClick={onClickStart}
          className="bg-blue-500 text-white  py-2 rounded-lg w-3/4"
        >
          시작하기
        </button>
        {startError && (
          <span className="text-red-500 text-xs">{startError}</span>
        )}
      </div>
    </div>
  );
}
