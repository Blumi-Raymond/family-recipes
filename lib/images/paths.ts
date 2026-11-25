// Where image files live in the Storage bucket "recipe-images".
// Every file is inside its group's folder (the database checks that):
//   <group_id>/dishes/<uuid>.webp        recipe photo, full size (up to 1600px)
//   <group_id>/dishes/<uuid>-thumb.webp  small copy for lists (up to 480px)
//   <group_id>/covers/...                same, for cookbook covers
//   <group_id>/pages/<uuid>.webp         cookbook page photo for scanning (up to 2576px)
//   <group_id>/pages/<uuid>-thumb.webp   small copy (up to 480px)
export const IMAGE_BUCKET = "recipe-images";

export const IMAGE_FOLDERS = ["dishes", "covers", "pages"] as const;
export type ImageFolder = (typeof IMAGE_FOLDERS)[number];

export function newImagePath(groupId: string, folder: ImageFolder, ext: "webp" | "jpg") {
  return `${groupId}/${folder}/${crypto.randomUUID()}.${ext}`;
}

// The small copy that sits next to every full-size image
export function thumbPath(path: string) {
  return path.replace(/\.(webp|jpg)$/, "-thumb.$1");
}
