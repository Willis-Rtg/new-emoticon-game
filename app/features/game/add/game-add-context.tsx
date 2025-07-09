import { createContext, useContext, useState } from "react";

export type TMessage = {
  id?: number;
  message: string;
  is_me: boolean;
};

export type TEmoticonScore = {
  id: number;
  name: string;
  image_url: string;
  score: {
    친절함: number;
    사회성: number;
    매력적: number;
    센스함: number;
    똑똑함: number;
  };
};

interface IGameAddContext {
  emoticons: TEmoticonScore[];
  setEmoticons: React.Dispatch<React.SetStateAction<TEmoticonScore[]>>;
  messages: TMessage[];
  setMessages: React.Dispatch<React.SetStateAction<TMessage[]>>;
  game_name: string;
  setGameName: React.Dispatch<React.SetStateAction<string>>;
}

const gameAddContext = createContext<IGameAddContext | null>(null);

export const GameAddContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [emoticons, setEmoticons] = useState<TEmoticonScore[]>([]);
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [game_name, setGameName] = useState<string>("");

  const value: IGameAddContext = {
    emoticons,
    setEmoticons,
    messages,
    setMessages,
    game_name,
    setGameName,
  };
  return (
    <gameAddContext.Provider value={value}>{children}</gameAddContext.Provider>
  );
};

export default function useGameAddContext() {
  const context = useContext(gameAddContext);
  if (!context) {
    throw new Error(
      "useGameAddContext must be used within a GameAddContextProvider"
    );
  }
  return context;
}
