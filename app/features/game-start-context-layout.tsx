import { Outlet } from "react-router";
import { GameStartContextProvider } from "./home/game-start-context";

export default function GameStartContextLayout() {
  return (
    <GameStartContextProvider>
      <Outlet />
    </GameStartContextProvider>
  );
}
