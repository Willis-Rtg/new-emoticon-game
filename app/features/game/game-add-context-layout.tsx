import { GameAddContextProvider } from "./add/game-add-context";
import { Outlet } from "react-router";

export default function GameContextLayout() {
  return (
    <GameAddContextProvider>
      <Outlet />
    </GameAddContextProvider>
  );
}
