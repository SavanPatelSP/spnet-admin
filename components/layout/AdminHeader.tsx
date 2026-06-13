import { Bell, Search, ChevronDown } from "lucide-react";

export default function AdminHeader() {
  return (
    <header
      className="
        border-b
        border-zinc-800
        bg-zinc-950/80
        backdrop-blur-xl
        px-6
        py-4
        flex
        items-center
        justify-between
      "
    >
      <div>
        <h2 className="text-xl font-bold">
          SP-NET Administration
        </h2>

        <p className="text-zinc-500 text-sm">
          Enterprise Management Console
        </p>
      </div>

      <div className="flex items-center gap-4">

        <div className="relative">

          <Search
            size={16}
            className="
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              text-zinc-500
            "
          />

          <input
            placeholder="Search..."
            className="
              w-72
              rounded-2xl
              border
              border-zinc-700
              bg-zinc-900/70
              pl-10
              pr-4
              py-3
              outline-none
              focus:border-zinc-500
            "
          />

        </div>

<button
  className="
    p-3
    rounded-2xl
    bg-zinc-900
    border
    border-zinc-800
    relative
  "
>
  <Bell size={18} />

  <span
    className="
      absolute
      -top-2
      -right-2
      w-5
      h-5
      rounded-full
      bg-red-500
      text-xs
      flex
      items-center
      justify-center
    "
  >
    3
  </span>
</button>

<div
  className="
    flex
    items-center
    gap-3
    rounded-2xl
    bg-zinc-900
    border
    border-zinc-800
    px-4
    py-2
  "
>

  <div
    className="
      w-10
      h-10
      rounded-full
      bg-gradient-to-br
      from-blue-500
      to-purple-500
      flex
      items-center
      justify-center
      font-bold
    "
  >
    A
  </div>

  <div>
<p className="font-medium">
  Savan Patel
</p>

<p className="text-xs text-zinc-500">
  Founder & Administrator
</p>
  </div>
<ChevronDown size={16} />

</div>

      </div>
    </header>
  );
}
