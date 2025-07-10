import { useState } from "react";
import { PlusIcon } from "lucide-react";
import TagComponent from "~/common/components/tag-component";
import { baseColors } from "~/common/constants";
import { Form, redirect, useNavigate, useNavigation } from "react-router";
import type { Route } from "./+types/emoticon-upload-modal";
import { z } from "zod";
import db from "~/db";
import { emoticonsTags, emoticonsTable, tagTable } from "~/features/schema";
import { inArray } from "drizzle-orm";
import AWS from "aws-sdk";
import { getSession } from "~/session";

const emoticonUploadSchema = z.object({
  emoticonFile: z.instanceof(File),
  tags: z.string({ required_error: "태그를 선택해주세요" }).min(1, {
    message: "1개 이상 태그를 선택해주세요",
  }),
  filename: z.string(),
});

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const { data, success, error } = emoticonUploadSchema.safeParse(
    Object.fromEntries(formData)
  );
  try {
    // const session = await getSession(request.headers.get("Cookie"));
    // const user = session.get("user");
    // if (!user) {
    //   return {
    //     formErrors: {
    //       emoticonFile: "로그인 후 이용해주세요",
    //     },
    //   };
    // }

    if (!success) {
      return {
        formErrors: error.flatten().fieldErrors,
      };
    }
    const tags = data.tags.split(",");
    const existTags = await db
      .select({ name: tagTable.name, id: tagTable.id })
      .from(tagTable)
      .where(inArray(tagTable.name, tags));
    const willInsertTags = tags.filter(
      (tag) => !existTags.some((t) => t.name === tag)
    );
    let newTags: any[] = [];
    if (willInsertTags.length) {
      const insertTags = await db
        .insert(tagTable)
        .values(
          willInsertTags.map((tag) => ({
            name: tag,
            created_at: new Date(),
            updated_at: new Date(),
          }))
        )
        .returning({ id: tagTable.id });
      newTags = [...insertTags];
    }

    const s3 = new AWS.S3({
      region: "ap-northeast-2",
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    });
    const uploadFilename = `${"userId"}-${Date.now()}-${data.filename}`;

    const arrayBuffer = await data.emoticonFile.arrayBuffer();

    const uploadParams = {
      Bucket: "new-emoticon-game",
      Key: uploadFilename,
      Body: Buffer.from(arrayBuffer),
      ContentType: "image/gif",
    };

    const { Location, Key } = await s3.upload(uploadParams).promise();

    console.log(Location, Key);

    let newEmoticon;
    if (Location) {
      newEmoticon = await db
        .insert(emoticonsTable)
        .values({
          name: data.filename,
          image_url: `https://new-emoticon-game.s3.ap-northeast-2.amazonaws.com/${Key}`,
          popular: 0,
        })
        .returning({ id: emoticonsTable.id });
    }
    if (newEmoticon && newTags?.length + existTags.length > 0) {
      await db.insert(emoticonsTags).values(
        [...newTags, ...existTags].map((tag) => ({
          emoticon_id: newEmoticon[0].id,
          tag_id: tag.id,
        }))
      );
      return null;
    }
  } catch (e) {
    return {
      formErrors: {
        emoticonFile: "이모티콘 업로드 error" + e,
      },
    };
  }
}

export const loader = async () => {
  const initTags = await db
    .select({ id: tagTable.id, name: tagTable.name })
    .from(tagTable);
  return { initTags };
};

export default function EmoticonUploadModal({
  loaderData,
}: Route.ComponentProps) {
  const [emoticonUploadFile, setEmoticonUploadFile] = useState<File | null>(
    null
  );
  const { initTags } = loaderData;
  const [tags, setTags] = useState<string[]>(initTags.map((tag) => tag.name));
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>("");
  const [uploadError, setUploadError] = useState<string>("");
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isSubmitting =
    navigation.state === "submitting" || navigation.state === "loading";
  const [loading, setLoading] = useState(false);

  async function onChangeEmoticonUploadFile(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = e.target.files;

    if (files) {
      setEmoticonUploadFile(files[0]);
    }
  }
  function onClickTags(tag: string) {
    if (selectedTags.includes(tag)) {
      setSelectedTags((prev) => prev.filter((item) => item !== tag));
    } else {
      setSelectedTags((prev) => [...prev, tag]);
    }
  }
  async function fetchPost() {
    setFormErrors({});
    if (!emoticonUploadFile) {
      return setFormErrors({
        emoticonFile: "이모티콘 파일을 선택해주세요",
      });
    }
    if (!selectedTags.length) {
      return setFormErrors({
        tags: "1개 이상 태그를 선택해주세요",
      });
    }
    if (selectedTags.length > 5) {
      return setFormErrors({
        tags: "5개 이하 태그를 선택해주세요",
      });
    }
    const formData = new FormData();
    formData.append("tags", selectedTags.join(","));
    formData.append("emoticonFile", emoticonUploadFile!);
    formData.append("filename", emoticonUploadFile!.name);
    setLoading(true);
    await fetch("/emoticon-upload", {
      method: "POST",
      body: formData,
    });
    setLoading(false);
    navigate("/");
  }

  return (
    <div
      onClick={() => navigate("/")}
      className="fixed inset-0 bg-black/20 bg-opacity-50 flex items-center justify-center"
    >
      <Form
        onClick={(e) => e.stopPropagation()}
        onSubmit={fetchPost}
        className="bg-white p-8 pb-12 min-w-[380px] max-h-[65vh] rounded-lg flex flex-col gap-4 items-center w-1/3"
        encType="multipart/form-data"
        // encType="application/x-www-form-urlencoded"
      >
        <h2 className="text-lg font-bold">이모티콘 업로드</h2>
        <div className="flex gap-2">
          <label
            className={`flex-3 flex flex-wrap  justify-center items-center bg-gray-100 rounded-lg cursor-pointer p-2 
          `}
          >
            {emoticonUploadFile ? (
              <img
                className="w-44 h-44 object-cover rounded-full"
                src={URL.createObjectURL(emoticonUploadFile)}
                alt=""
              />
            ) : (
              <PlusIcon size={24} />
            )}
            <input
              className="hidden"
              name="emoticonFile"
              type="file"
              accept=".gif"
              onChange={onChangeEmoticonUploadFile}
            />
          </label>
          <div className="flex-2 flex flex-col items-center justify-center bg-neutral-100 p-2 max-h-[35vh]">
            <input
              className="bg-white rounded-lg px-1 outline-none text-sm"
              type="text"
              placeholder="추가 해시태그"
              value={newTag}
              onChange={(e) => {
                if (e.target.value.length > 15)
                  return setUploadError("태그는 15자 이하로 입력해주세요.");
                setNewTag(e.target.value);
              }}
              onKeyDown={async (e) => {
                setUploadError("");
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  if (!tags.includes(newTag)) {
                    await new Promise((resolve) => {
                      setTimeout(resolve, 300);
                      setTags((prev) => [newTag, ...prev]);
                      setSelectedTags((prev) => [newTag, ...prev]);
                    });
                  } else {
                    setTags((prev) => [
                      newTag,
                      ...prev.filter((item) => item !== newTag),
                    ]);
                    setSelectedTags((prev) => [newTag, ...prev]);
                  }
                  setNewTag("");
                }
              }}
              size={12}
            />
            <div
              className="py-2 px-1 flex flex-wrap gap-1 overflow-y-scroll max-h-[36vh]"
              style={{ scrollbarWidth: "none" }}
            >
              {tags.map((tag, index) => (
                <TagComponent
                  key={index}
                  onClick={() => onClickTags(tag)}
                  style={{ backgroundColor: baseColors[index % 5] }}
                  className={`cursor-pointer ${
                    selectedTags.includes(tag)
                      ? "ring-1 ring-black"
                      : "opacity-50"
                  }`}
                  tag={tag}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="w-full flex-wrap flex gap-2 justify-center bg-neutral-100">
          {selectedTags.map((tag, index) => (
            <TagComponent
              key={index}
              onClick={() => onClickTags(tag)}
              style={{ backgroundColor: baseColors[index % 5] }}
              className={`cursor-pointer ${
                selectedTags.includes(tag) ? "ring-1 ring-black" : "opacity-50"
              }`}
              tag={tag}
            />
          ))}
        </div>
        <button
          disabled={loading}
          className="bg-blue-500 text-white  py-2 rounded-lg w-3/4"
        >
          {loading ? "업로드 중..." : "업로드"}
        </button>
        {formErrors.emoticonFile && (
          <p className="text-red-500 text-xs">{formErrors.emoticonFile}</p>
        )}
        {formErrors.tags && (
          <p className="text-red-500 text-xs">{formErrors.tags}</p>
        )}
        {uploadError && <p className="text-red-500 text-xs">{uploadError}</p>}
      </Form>
    </div>
  );
}
