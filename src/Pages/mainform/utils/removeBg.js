const REMOVE_BG_KEYS = [
  "e69bj6px7qJKw5x4N1XepLM9",
  "e69bj6px7qJKw5x4N1XepLM9",
];

let keyIndex = 0;

export async function removeBg(file) {
  for (let i = 0; i < REMOVE_BG_KEYS.length; i++) {
    const key = REMOVE_BG_KEYS[keyIndex];

    const formData = new FormData();
    formData.append("image_file", file);
    formData.append("size", "auto");

    try {
      const res = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": key,
        },
        body: formData,
      });

      if (res.status === 200) {
        return await res.blob();
      } else {
        keyIndex = (keyIndex + 1) % REMOVE_BG_KEYS.length;
      }
    } catch {
      keyIndex = (keyIndex + 1) % REMOVE_BG_KEYS.length;
    }
  }

  throw new Error("All remove.bg keys exhausted");
}