import { useRef, useState } from "react";
import { removeBg } from "../utils/removeBg";
import { ProgressCircle } from "@heroui/react";
export default function ImageUploadWithBgRemove({
  onImageReady,
  setEditingImage,
  setOnImageDone,
  currentImage, // ← blob or URL of the already-uploaded image
  onRequestReEdit,
  setOpen,
  open, // ← called when user clicks the preview to re-edit
}) {
  const inputRef = useRef();
  const [load, setLoad] = useState(false);
  const handleFile = async (file) => {
    try {
      setLoad(true);
      const bgRemoved = await removeBg(file);
      const preview = URL.createObjectURL(bgRemoved);
      if (preview) {
        setOpen(true);
        setLoad(false);
      }
      setEditingImage(preview);
      setOnImageDone(() => (blob) => {
        onImageReady(blob);
      });
    } catch (err) {
      console.error(err);
      alert("Background removal failed");
    }
  };
  const src =
    currentImage instanceof Blob
      ? URL.createObjectURL(currentImage)
      : currentImage;

  // If an image is already uploaded, show the preview thumbnail

  // Default: empty upload zone
  return (
    <>
      {load ? (
        <div className="h-[190px] border flex flex-col gap-2 justify-center items-center p-2 rounded-lg cursor-pointer hover:bg-slate-50 transition">
          <ProgressCircle isIndeterminate aria-label="Loading">
            <ProgressCircle.Track>
              <ProgressCircle.TrackCircle />
              <ProgressCircle.FillCircle />
            </ProgressCircle.Track>
          </ProgressCircle>{" "}
        </div>
      ) : currentImage ? (
        <div
          onClick={() => inputRef.current.click()}
          className="relative w-full h-[190px] border-2 border-dashed border-primary rounded-lg overflow-hidden cursor-pointer group"
        >
          <img
            src={src}
            alt="Uploaded"
            className="w-full h-full object-contain bg-slate-50"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
              />
            </svg>
            <p className="text-white text-xs font-semibold">Tap to change</p>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current.click()}
          className="h-[190px] border flex flex-col gap-2 justify-center items-center p-2 rounded-lg cursor-pointer hover:bg-slate-50 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-6 text-gray-600 font-bold"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
            />
          </svg>
          <p className="text-xs text-gray-600 font-bold">Upload Image</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) handleFile(file);
          // Reset so the same file can be re-selected
          e.target.value = "";
        }}
      />
    </>
  );
}
