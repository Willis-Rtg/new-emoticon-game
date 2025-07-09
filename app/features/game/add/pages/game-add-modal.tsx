import { useEffect, useRef, useState } from "react";
import { useFetcher, useNavigate } from "react-router";
import TagComponent from "~/common/components/tag-component";
import useGameAddContext from "../game-add-context";
import type { Route } from "./+types/game-add-modal";
import db from "~/db";
import { emoticonsTable, emoticonsTags, tagTable } from "~/features/schema";
import { desc, eq } from "drizzle-orm";

const dumiTags = [
  "사랑스러워",
  "혐오...",
  "극혐..",
  "사랑",
  "멎져",
  "센스",
  "센스쟁이",
  "hello",
];

const scores = [
  { name: "친절함", color: "#f5ffb1" },
  { name: "사회성", color: "#f0d1db" },
  { name: "매력적", color: "#dff9fb" },
  { name: "센스함", color: "#c5edb1" },
  { name: "똑똑함", color: "#FECB91" },
];

type TTag = {
  id: number;
  name: string;
};
type TEmoticon = {
  id: number;
  name: string;
  image_url: string;
  tags: TTag[];
};

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const getItem = url.searchParams.get("getItem");
  const emoticonPage = Number(url.searchParams.get("emoticonPage"));
  const tagPage = Number(url.searchParams.get("tagPage"));
  const index = Number(url.searchParams.get("index"));

  let DBEmoticons = await db
    .select({
      id: emoticonsTable.id,
      name: emoticonsTable.name,
      image_url: emoticonsTable.image_url,
      tag: {
        id: tagTable.id,
        name: tagTable.name,
      },
    })
    .from(emoticonsTable)
    .innerJoin(emoticonsTags, eq(emoticonsTable.id, emoticonsTags.emoticon_id))
    .innerJoin(tagTable, eq(emoticonsTags.tag_id, tagTable.id))
    .limit(30)
    .offset(emoticonPage * 30)
    .orderBy(desc(emoticonsTable.created_at));

  let DBTags = await db
    .select({
      id: tagTable.id,
      name: tagTable.name,
    })
    .from(tagTable)
    .limit(20)
    .offset(tagPage * 20)
    .orderBy(desc(tagTable.created_at));

  let DBEmoticons_sorted: TEmoticon[] = [];
  let noneOverlapEmoticon: any[] = [];

  for (const item of DBEmoticons) {
    for (const item2 of DBEmoticons) {
      if (
        item.id !== item2.id &&
        !noneOverlapEmoticon.find((item) => item.id === item2.id)
      ) {
        noneOverlapEmoticon.push(item2);
      }
    }
  }

  DBEmoticons_sorted = noneOverlapEmoticon.map((item) => {
    const tags: TTag[] = [];
    for (const emoticon of DBEmoticons) {
      if (item.id === emoticon.id) {
        tags.push({
          id: emoticon.tag.id,
          name: emoticon.tag.name,
        });
      }
    }
    return {
      id: item.id,
      name: item.name,
      image_url: item.image_url,
      tags,
    };
  });

  if (getItem === "emoticon" && emoticonPage > 0) {
    DBTags = [];
  } else if (getItem === "tag" && tagPage > 0) {
    DBEmoticons_sorted = [];
  }

  return { DBEmoticons: DBEmoticons_sorted, initTags: DBTags, index };
}

export default function GameAddModal({ loaderData }: Route.ComponentProps) {
  const [selectedTags, setSelectedTags] = useState<TTag[]>([]);
  const { DBEmoticons, initTags, index } = loaderData;
  const [initEmoticons, setInitEmoticons] = useState<TEmoticon[]>(DBEmoticons);
  const [tags, setTags] = useState<TTag[]>(initTags);
  const navigate = useNavigate();

  function onClickTag(e: React.MouseEvent<HTMLElement>, tag: TTag) {
    const target = e.currentTarget;
    // const tag = target.textContent?.substring(2);

    if (selectedTags.find((item) => item.id === tag.id)) {
      target.style.backgroundColor = "white";
      setSelectedTags((prev) => prev.filter((item) => item.id !== tag.id));
    } else {
      if (tag) {
        target.style.backgroundColor = "#F8CD58";
        setSelectedTags((prev) => [...prev, tag]);
      }
    }
  }

  function onClickScore(e: React.MouseEvent<HTMLButtonElement>) {
    const target = e.currentTarget;
    const score = target.textContent?.split(" ")[1];

    if (selectedScore.includes(score as string)) {
      setSelectedScore((prev) => prev.filter((item) => item !== score));
    } else {
      if (score) {
        setSelectedScore((prev) => [...prev, score]);
      }
    }
  }

  useEffect(() => {
    setInitEmoticons(DBEmoticons);
  }, [DBEmoticons]);

  useEffect(() => {
    if (selectedTags.length > 0) {
      const selectedEmoticons: TEmoticon[] = [];
      for (const selectedTag of selectedTags) {
        const selectEmoticon = DBEmoticons.find((emoticons) =>
          emoticons.tags.find((tag) => tag.id === selectedTag.id)
        );
        if (selectEmoticon) {
          if (
            selectedEmoticons.find(
              (emoticons) => emoticons.id === selectEmoticon.id
            )
          ) {
          } else {
            selectedEmoticons.push(selectEmoticon);
          }
        }
      }
      setInitEmoticons(selectedEmoticons);
    } else {
      setInitEmoticons(DBEmoticons);
    }
  }, [selectedTags]);

  const emoticonScrollRef = useRef<HTMLDivElement>(null);
  const tagScrollRef = useRef<HTMLDivElement>(null);
  const [emoticonPage, setEmoticonPage] = useState<number>(1);
  const [tagPage, setTagPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const fetcher = useFetcher<typeof loader>();

  function fetchEmoticons() {
    setLoading(true);
    fetcher.load(
      `/game/add/modal?getItem=emoticon&emoticonPage=${emoticonPage}`
    );
  }

  useEffect(() => {
    if (fetcher.data?.DBEmoticons) {
      if (fetcher.data.DBEmoticons.length > 0 && selectedTags.length < 1) {
        setInitEmoticons((prev) => [...prev, ...fetcher.data!.DBEmoticons]);
        setEmoticonPage((prev) => prev + 1);
      }
    }
    setLoading(false);
  }, [fetcher.data?.DBEmoticons]);

  async function fetchTags() {
    setLoading(true);
    await fetcher.load(`/game/add/modal?getItem=tag&tagPage=${tagPage}`);
  }
  useEffect(() => {
    if (fetcher.data?.initTags) {
      if (fetcher.data.initTags.length > 0 && selectedTags.length < 1) {
        setTags((prev) => [...prev, ...fetcher.data!.initTags]);
        setTagPage((prev) => prev + 1);
      }
    }
    setLoading(false);
  }, [fetcher.data?.initTags]);

  useEffect(() => {
    const obaserver = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        if (
          entries[0]?.isIntersecting &&
          !loading &&
          entries[0].target === emoticonScrollRef.current
          // !startScroll
        ) {
          fetchEmoticons();
        }
        if (
          entries[0]?.isIntersecting &&
          !loading &&
          entries[0].target === tagScrollRef.current
          // !startScroll
        ) {
          fetchTags();
        }
      }
    );
    if (emoticonScrollRef.current) {
      obaserver.observe(emoticonScrollRef.current);
    }
    if (tagScrollRef.current) {
      obaserver.observe(tagScrollRef.current);
    }
    return () => {
      obaserver.disconnect();
    };
  }, [emoticonPage, tagPage]);

  const { setEmoticons, emoticons } = useGameAddContext();

  const [selectedEmoticon, setSelectedEmoticon] = useState<TEmoticon | null>(
    null
  );
  const [selectedScore, setSelectedScore] = useState<string[]>([]);
  const [error, setError] = useState("");

  function onClickSelect() {
    if (!selectedEmoticon) {
      setError("이모티콘을 선택해주세요");
      return;
    }
    if (selectedScore.length < 2) {
      setError("2개 이상의 점수를 선택해주세요");
      return;
    }
    setError("");
    if (index === 0) {
      setEmoticons((prev) => {
        return [
          {
            ...selectedEmoticon,
            score: {
              친절함: selectedScore.find((score) => score === "친절함") ? 1 : 0,
              사회성: selectedScore.find((score) => score === "사회성") ? 1 : 0,
              매력적: selectedScore.find((score) => score === "매력적") ? 1 : 0,
              센스함: selectedScore.find((score) => score === "센스함") ? 1 : 0,
              똑똑함: selectedScore.find((score) => score === "똑똑함") ? 1 : 0,
            },
          },
          prev[1],
          prev[2],
        ];
      });
    } else if (index === 1) {
      setEmoticons((prev) => [
        prev[0],
        {
          ...selectedEmoticon,
          score: {
            친절함: selectedScore.find((score) => score === "친절함") ? 1 : 0,
            사회성: selectedScore.find((score) => score === "사회성") ? 1 : 0,
            매력적: selectedScore.find((score) => score === "매력적") ? 1 : 0,
            센스함: selectedScore.find((score) => score === "센스함") ? 1 : 0,
            똑똑함: selectedScore.find((score) => score === "똑똑함") ? 1 : 0,
          },
        },
        prev[2],
      ]);
    } else if (index === 2) {
      setEmoticons((prev) => [
        prev[0],
        prev[1],
        {
          ...selectedEmoticon,
          score: {
            친절함: selectedScore.find((score) => score === "친절함") ? 1 : 0,
            사회성: selectedScore.find((score) => score === "사회성") ? 1 : 0,
            매력적: selectedScore.find((score) => score === "매력적") ? 1 : 0,
            센스함: selectedScore.find((score) => score === "센스함") ? 1 : 0,
            똑똑함: selectedScore.find((score) => score === "똑똑함") ? 1 : 0,
          },
        },
      ]);
    }
    navigate("/game/add");
    setSelectedEmoticon(null);
    setSelectedScore([]);
  }

  return (
    <div
      onClick={() => navigate("/game/add")}
      className="fixed inset-0 bg-black/20 bg-opacity-50 flex items-center justify-center z-30"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white p-4 pb-12 min-w-[340px] w-full max-w-[360px] rounded-lg flex flex-col gap-4 justify-between items-center h-full max-h-8/12 overflow-hidden"
      >
        <h2 className="text-lg font-bold">이모티콘 선택</h2>
        <div className="flex gap-2 h-full max-h-9/12">
          <div
            className="flex-2 flex flex-wrap items-center justify-center gap-4 overflow-scroll "
            style={{ scrollbarWidth: "none" }}
          >
            {initEmoticons
              .filter((emoticon) => {
                return !emoticons?.find((item) => item?.id === emoticon?.id);
              })
              .map((emoticon, index) => (
                <img
                  key={index}
                  className={`w-20 h-20 rounded-full ${
                    selectedEmoticon?.id === emoticon.id
                      ? "ring-2 ring-[#F8CD58] shadow-lg shadow-[#F8CD58]"
                      : ""
                  }`}
                  src={emoticon.image_url}
                  alt={emoticon.name}
                  onClick={(e) => setSelectedEmoticon(emoticon)}
                />
              ))}
            <div ref={emoticonScrollRef}></div>
          </div>
          <div className="flex-1 flex flex-col gap-2 p-2 bg-neutral-200 rounded-xl h-full overflow-scroll">
            <input
              placeholder="tag 검색"
              className="w-full px-2 py-1 bg-white rounded-xl outline-none text-sm"
            />
            <div className="flex flex-wrap gap-1 ">
              {tags.map((tag: any, index) => (
                <TagComponent
                  key={index}
                  onClick={(e) => onClickTag(e, tag)}
                  tag={tag.name}
                />
              ))}
              <div ref={tagScrollRef}></div>
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-2">
          {scores.map((score, index) => (
            <TagComponent
              key={index}
              style={{ backgroundColor: score.color }}
              className={` ${
                selectedScore.includes(score.name)
                  ? "ring-1 ring-gray"
                  : "opacity-50"
              }`}
              onClick={onClickScore}
              tag={score.name}
              score={true}
            />
          ))}
        </div>
        <button
          onClick={onClickSelect}
          className="bg-neutral-500 text-white p-2 px-4 text-sm rounded-lg font-semibold"
        >
          선택
        </button>
        {error && <p className="text-red-500 text-xs">{error}</p>}
      </div>
    </div>
  );
}
