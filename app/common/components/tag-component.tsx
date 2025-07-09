import { ArrowUpIcon, ChevronUpIcon } from "lucide-react";
import { type ButtonHTMLAttributes, type HTMLAttributes } from "react";

export default function TagComponent({
  tag,
  from = false,
  score = false,
  className,
  ...rest
}: {
  tag: string;
  from?: boolean;
  score?: boolean;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <div
      className={`bg-white text-black text-xs p-1 rounded-lg cursor-pointer ${className} flex justify-center items-center`}
      {...rest}
    >
      {from ? "@" : score ? <ArrowUpIcon className="w-3 h-3" /> : "#"} {tag}
    </div>
  );
}
