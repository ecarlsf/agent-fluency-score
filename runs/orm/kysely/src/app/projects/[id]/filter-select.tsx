"use client";

import { useRouter } from "next/navigation";

export function FilterSelect({
  id,
  value,
  placeholder,
  options,
  buildHref,
}: {
  id: string;
  value?: string;
  placeholder: string;
  options: { value: string; label: string }[];
  buildHref: (value: string | undefined) => string;
}) {
  const router = useRouter();

  return (
    <select
      id={id}
      value={value ?? ""}
      onChange={(e) => {
        const val = e.target.value || undefined;
        router.push(buildHref(val));
      }}
      className="flex h-9 w-[180px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
