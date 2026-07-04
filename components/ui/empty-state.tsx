import Image from "next/image";
import Link from "next/link";
import { Button } from "./button";

interface EmptyStateProps {
  message?: string;
  showUploadLink?: boolean;
}

export function EmptyState({
  message = "No data uploaded yet",
  showUploadLink = false,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <Image
        src="/ferguson-logo.png"
        alt="Ferguson"
        width={48}
        height={48}
        className="mb-4 h-12 w-auto object-contain opacity-60"
      />
      <p className="text-sm text-slate-600">{message}</p>
      {showUploadLink && (
        <div className="mt-4">
          <Button href="/upload">Upload spreadsheet</Button>
        </div>
      )}
    </div>
  );
}
