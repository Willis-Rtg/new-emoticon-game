import { Outlet } from "react-router";

export function meta() {
  return [
    {
      title: "Emoticon Game",
    },
  ];
}

export default function Layout() {
  const year = new Date().getFullYear();
  return (
    <div className="flex flex-col items-center justify-center h-screen w-full">
      <Outlet />
      <div className="text-xs fixed bottom-2">
        <span>&copy; {year} Emoticon Game by Willis. All rights reserved.</span>
      </div>
    </div>
  );
}
