import { redirect } from "react-router";
import { commitSession, getSession } from "~/session";

export async function loader({ request }: { request: Request }) {
  const session = await getSession(request.headers.get("Cookie"));
  session.unset("user");
  const cookie = await commitSession(session);
  return redirect("/", { headers: { "Set-Cookie": cookie } });
}
