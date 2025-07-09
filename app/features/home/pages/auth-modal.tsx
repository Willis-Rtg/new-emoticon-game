import { Form, redirect, useNavigate, useNavigation } from "react-router";
import { useState } from "react";
import { z } from "zod";
import { commitSession, getSession } from "~/session";
import db from "~/db";
import { userTable } from "~/features/schema";
import { eq, or } from "drizzle-orm";
import crypto from "crypto";
import type { Route } from "./+types/auth-modal";

const loginSchema = z.object({
  id: z
    .string({ required_error: "아이디를 입력해주세요" })
    .min(1)
    .max(20, "아이디는 20자 이하로 입력해주세요"),
  password: z
    .string({ required_error: "비밀번호를 입력해주세요" })
    .min(1)
    .max(20, "비밀번호는 20자 이하로 입력해주세요"),
});

const signupSchema = z.object({
  id: z
    .string({ required_error: "아이디를 입력해주세요" })
    .min(1)
    .max(20, "아이디는 20자 이하로 입력해주세요"),
  password: z
    .string({ required_error: "비밀번호를 입력해주세요" })
    .min(1)
    .max(20, "비밀번호는 20자 이하로 입력해주세요"),
  email: z.string({ required_error: "이메일을 입력해주세요" }).email(),
});

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const type = formData.get("type");

  if (type === "login") {
    const loginData = loginSchema.safeParse(Object.fromEntries(formData));
    if (!loginData.success) {
      return {
        authErrors: null,
        formErrors: loginData.error.flatten().fieldErrors,
      };
    }
    const user = await db
      .select()
      .from(userTable)
      .where(eq(userTable.name, loginData.data.id));

    if (!user) {
      return {
        authErrors: ["해당 유저가 없습니다."],
        formErrors: {},
      };
    }
    const ugly_password = crypto
      .createHash("sha256")
      .update(loginData.data.password)
      .digest("hex");

    if (user[0]?.password !== ugly_password) {
      return {
        authErrors: ["아이디나 비밀번호가 일치하지 않습니다"],
        formErrors: {},
      };
    }
    const session = await getSession(request.headers.get("Cookie"));
    session.set("user", user);
    const cookie = await commitSession(session);
    return redirect("/", { headers: { "Set-Cookie": cookie } });
  } else {
    const signupData = signupSchema.safeParse(Object.fromEntries(formData));
    if (!signupData.success) {
      return {
        authErrors: null,
        formErrors: signupData.error.flatten().fieldErrors,
      };
    }
    const existUser = await db
      .select()
      .from(userTable)
      .where(
        or(
          eq(userTable.name, signupData.data.id),
          eq(userTable.email, signupData.data.email)
        )
      );
    if (existUser.length > 0) {
      return {
        authErrors: ["아이디 혹은 이메일이 이미 존재합니다"],
        formErrors: {},
      };
    }

    const ugly_password = crypto
      .createHash("sha256")
      .update(signupData.data.password)
      .digest("hex");

    const newUser = await db.insert(userTable).values({
      name: signupData.data.id,
      password: ugly_password,
      email: signupData.data.email,
    });

    const session = await getSession(request.headers.get("Cookie"));
    session.set("user", newUser);
    const cookie = await commitSession(session);

    return redirect("/", { headers: { "Set-Cookie": cookie } });
  }
}

export default function LoginModal({ actionData }: Route.ComponentProps) {
  const [loginSiginup, setLoginSiginup] = useState<"login" | "signup">("login");
  const navigation = useNavigation();
  const isSubmitting =
    navigation.state === "submitting" || navigation.state === "loading";

  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate("/")}
      className="fixed inset-0 bg-black/20 bg-opacity-50 flex items-center justify-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col justify-center items-center bg-white p-8 pb-12 min-w-[340px] rounded-lg w-1/3 gap-4"
      >
        <Form method="post" className="flex flex-col gap-4 items-center w-full">
          <h2 className="text-lg font-bold">로그인</h2>
          <input type="hidden" name="type" value={loginSiginup} />
          <input
            type="text"
            name="id"
            placeholder="아이디"
            className="w-3/4 p-2  bg-gray-100 rounded-lg"
          />
          <input
            name="password"
            type="password"
            placeholder="비밀번호"
            className="w-3/4 p-2  bg-gray-100 rounded-lg"
          />
          {loginSiginup === "signup" && (
            <input
              name="email"
              type="email"
              placeholder="이메일"
              className="w-3/4 p-2  bg-gray-100 rounded-lg"
            />
          )}
          {loginSiginup === "login" ? (
            <button
              type="submit"
              className="bg-blue-500 text-white  py-2 rounded-lg w-3/4"
            >
              로그인
            </button>
          ) : (
            <button
              type="submit"
              className="bg-blue-500 text-white  py-2 rounded-lg w-3/4"
            >
              회원가입
            </button>
          )}
          {actionData &&
            "authErrors" in actionData &&
            actionData.authErrors?.map((error) => (
              <p className="text-red-500 text-xs">{error}</p>
            ))}
        </Form>
        <button
          onClick={() => {
            if (loginSiginup === "login") {
              setLoginSiginup("signup");
            } else {
              setLoginSiginup("login");
            }
          }}
          className="text-pink-400 text-xs font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "로딩중"
            : loginSiginup === "login"
            ? "회원가입"
            : "로그인"}
        </button>
      </div>
    </div>
  );
}
