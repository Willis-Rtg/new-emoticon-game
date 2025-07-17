import { ArrowLeftIcon, PlusCircleIcon, SendIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, Outlet } from "react-router";
import useGameAddContext, { type TMessage } from "./game-add-context";
import TagComponent from "~/common/components/tag-component";

export default function GameAddLayout() {
  const [message, setMessage] = useState<TMessage>({
    message: "",
    is_me: true,
  });
  const [selectedMe, setSelectedMe] = useState<boolean>(true);
  const deleteCount = useRef<number>(0);

  const messagesRef = useRef<HTMLDivElement>(null);

  function onClickMe(e: React.MouseEvent<HTMLElement>, isMe: boolean) {
    const target = e.currentTarget;
    target.parentNode?.childNodes.forEach((node) => {
      (node as HTMLElement).style.backgroundColor = "white";
      (node as HTMLElement).classList.remove("ring-2", "ring-black");
    });
    target.style.backgroundColor = "#F8CD58";
    target.classList.add("ring-2", "ring-black");
    setSelectedMe(isMe);
  }
  function onClickDeleteMessage(e: React.MouseEvent<HTMLElement>) {
    const parent = e.currentTarget.parentElement;
    const key = parent?.getAttribute("data-key");
    if (key) {
      setMessages((prev) => prev.filter((item) => item.id !== Number(key)));
      deleteCount.current += 1;
    }
  }

  const {
    emoticons,
    setEmoticons,
    messages,
    setMessages,
    game_name,
    setGameName,
  } = useGameAddContext();

  useEffect(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight + 40,
    });
  }, [messages]);

  return (
    <div className="relative bg-[#B2C6D9] max-w-lg w-full max-h-screen h-full flex flex-col justify-start overflow-hidden">
      <div className="top-4 px-4 flex justify-between max-w-lg w-full mt-4 mb-4">
        <Link to="/">
          <ArrowLeftIcon />
        </Link>
        <Link
          to="/game/add/save-modal"
          className="bg-neutral-500 p-2 -m-2 rounded-xl text-white"
        >
          저장
        </Link>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center h-screen">
        <h1>게임 만들기</h1>
      </div>
      <div
        ref={messagesRef}
        className="flex flex-col items-center justify-start h-8/11 gap-4 px-2 pt-8 pb-4 overflow-scroll z-10"
        style={{ scrollbarWidth: "none" }}
      >
        {messages.map((message, index) => {
          const isMe = message.is_me;
          return (
            <div
              className={`relative p-2 rounded-xl ${
                isMe ? "ml-auto bg-[#F8CD58]" : "mr-auto bg-white"
              }`}
              key={message.id}
              data-key={message.id}
            >
              {message.message}
              <div
                onClick={onClickDeleteMessage}
                className="absolute -top-1 -right-1 rounded-full"
              >
                <XIcon size={16} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="justify-around max-w-lg w-full flex pt-4">
        <Link
          to="game/add/modal?index=0"
          className="bg-white p-2 rounded-xl flex items-center justify-center z-20"
        >
          {emoticons[0] ? (
            <img
              src={emoticons[0].image_url}
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <PlusCircleIcon size={40} className="text-black/70" />
          )}
        </Link>
        <Link
          to="game/add/modal?index=1"
          className="bg-white p-2 rounded-xl flex items-center justify-center z-20"
        >
          {emoticons[1] ? (
            <img
              src={emoticons[1].image_url}
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <PlusCircleIcon size={40} className="text-black/70" />
          )}
        </Link>
        <Link
          to="game/add/modal?index=2"
          className="bg-white p-2 rounded-xl flex items-center justify-center z-20"
        >
          {emoticons[2] ? (
            <img
              src={emoticons[2].image_url}
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <PlusCircleIcon size={40} className="text-black/70" />
          )}
        </Link>
      </div>
      <div className="w-full max-w-lg flex gap-2 px-8 mb-2 mt-2">
        <TagComponent
          onClick={(e) => onClickMe(e, false)}
          from={true}
          tag="상대"
          style={{ backgroundColor: "white" }}
        />
        <TagComponent
          onClick={(e) => onClickMe(e, true)}
          from={true}
          tag="나"
          className="ring-2 ring-black"
          style={{ backgroundColor: "#F8CD58" }}
        />
      </div>
      <div className="w-full max-w-lg flex justify-center gap-1 mb-8">
        <input
          className="bg-white w-3/4 p-2 rounded-xl outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              const currentMessage = message.message;
              if (currentMessage.trim()) {
                setTimeout(() => {
                  setMessages([
                    ...messages,
                    {
                      id: messages.length + deleteCount.current + 1,
                      message: currentMessage,
                      is_me: selectedMe,
                    },
                  ]);
                  setMessage({
                    message: "",
                    is_me: selectedMe,
                  });
                }, 10);
              }
            }
          }}
          onChange={(e) =>
            setMessage({
              message: e.target.value,
              is_me: selectedMe,
            })
          }
          value={message.message}
          placeholder="메세지를 만들어주세요."
          type="text"
        />
        <button
          onClick={() => {
            const currentMessage = message.message;
            if (currentMessage.trim()) {
              setMessages([
                ...messages,
                {
                  id: messages.length + deleteCount.current + 1,
                  message: currentMessage,
                  is_me: selectedMe,
                },
              ]);
            }
            setMessage({
              message: "",
              is_me: selectedMe,
            });
          }}
          className="bg-[#F8CD58] p-2 rounded-xl"
        >
          <SendIcon className="text-black/70" />
        </button>
      </div>
      <Outlet />
    </div>
  );
}
