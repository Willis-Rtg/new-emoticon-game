import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  layout("features/layout.tsx", [
    layout("features/game-start-context-layout.tsx", [
      //  index("features/home.tsx"),
      ...prefix("game", [
        layout("features/game/game-add-context-layout.tsx", [
          route(":id", "features/game/game-page.tsx"),
          layout("features/game/add/layout.tsx", [
            route("add", "features/game/add/pages/game-add-page.tsx"),
            route("add/modal", "features/game/add/pages/game-add-modal.tsx"),
            route(
              "add/save-modal",
              "features/game/add/pages/game-save-modal.tsx"
            ),
          ]),
        ]),
        route("final", "features/game/final/pages/game-final-page.tsx"),
      ]),
      layout("features/home/layout.tsx", [
        index("features/home/pages/home.tsx"),
        route("auth", "features/home/pages/auth-modal.tsx"),
        route("auth/logout", "features/home/pages/logout.tsx"),
        route("start", "features/home/pages/start-modal.tsx"),
        route(
          "emoticon-upload",
          "features/home/pages/emoticon-upload-modal.tsx"
        ),
      ]),
    ]),
  ]),
] satisfies RouteConfig;
