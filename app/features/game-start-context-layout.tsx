import { Outlet } from "react-router";
import { GameStartContextProvider } from "./home/game-start-context";

export default function GameStartContextLayout() {
  return (
    <GameStartContextProvider initValue={{ gameIndex: 0, selectedGames: [] }}>
      <Outlet />
    </GameStartContextProvider>
  );
}
