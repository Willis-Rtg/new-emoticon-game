import { createContext, useContext, useState } from "react";

export interface IEmoticon {
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
}

export interface IGame {
  id: number;
  name: string;
  emoticon?: IEmoticon;
}

interface IGameStart {
  gameIndex: number;
  selectedGames: IGame[];
  setGameIndex: (gameIndex: number) => void;
  setSelectedGames: (selectedGames: IGame[]) => void;
}

const gameStartContext = createContext<IGameStart | null>(null);

export const GameStartContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [gameIndex, setGameIndex] = useState<number>(0);
  const [selectedGames, setSelectedGames] = useState<IGame[]>([]);

  const value = {
    gameIndex,
    selectedGames,
    setGameIndex,
    setSelectedGames,
  };

  return (
    <gameStartContext.Provider value={value}>
      {children}
    </gameStartContext.Provider>
  );
};

export default function useGameStartContext() {
  const context = useContext(gameStartContext);
  if (!context) {
    throw new Error(
      "useGameStartContext must be used within a GameStartContextProvider"
    );
  }
  return context;
}
