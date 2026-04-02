"use client";

import { useState, useRef } from "react";
import { ImageIcon, Plus, Sparkles, X } from "lucide-react";
import Link from "next/link";

interface InspirationImage {
  file: File;
  preview: string;
}

interface InspirationUploadProps {
  isPaid: boolean;
  onAnalysisComplete?: (description: string) => void;
}

export function InspirationUpload({ isPaid, onAnalysisComplete }: InspirationUploadProps) {
  const [images, setImages] = useState<InspirationImage[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (images.length >= 4) return;
    if (file.size > 5 * 1024 * 1024) return;

    const preview = URL.createObjectURL(file);
    setImages((prev) => [...prev, { file, preview }]);
    e.target.value = "";
  }

  function removeImage(idx: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  if (!isPaid) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-5 text-center">
        <ImageIcon className="w-6 h-6 text-gray-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-700">Design Inspiration</p>
        <p className="text-xs text-gray-500 mt-1">
          Upload screenshots from Dribbble, Pinterest, or any reference
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Available on{" "}
          <Link href="/dashboard/billing" className="font-medium text-accent">
            Starter & Pro plans
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Design inspiration (optional)
          </p>
          <p className="text-xs text-gray-500">
            Upload up to 4 screenshots — style will be analyzed
          </p>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {images.length}/4
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {images.map((img, i) => (
          <div
            key={i}
            className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200"
          >
            <img
              src={img.preview}
              className="w-full h-full object-cover"
              alt=""
            />
            <button
              onClick={() => removeImage(i)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}
        {images.length < 4 && (
          <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-accent flex flex-col items-center justify-center cursor-pointer hover:bg-accent-light/30 transition-all">
            <Plus className="w-5 h-5 text-gray-400" />
            <span className="text-[10px] text-gray-400 mt-1">Add</span>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileAdd}
            />
          </label>
        )}
      </div>

      {images.length > 0 && (
        <button
          onClick={() => {
            // For now, just acknowledge the upload
            onAnalysisComplete?.(
              `User uploaded ${images.length} inspiration image(s). Apply a clean, modern visual style matching the uploaded references.`
            );
          }}
          className="w-full py-2 text-sm font-medium text-white bg-accent rounded-xl hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Continue with these references
        </button>
      )}
    </div>
  );
}
