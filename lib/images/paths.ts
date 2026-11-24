// Where image files live in the Storage bucket "recipe-images".
// Every file is inside its group's folder (the database checks that):
//   <group_id>/recipes/<uuid>.webp        full size (up to 1600px)
//   <group_id>/recipes/<uuid>-thumb.webp  small copy for lists (up to 480px)
//   <group_id>/cookbooks/...              same, for cookbook covers
export const IMAGE_BUCKET = "recipe-images";

export type ImageFolder = "recipes" | "cookbooks";

export function newImagePath(groupId: string, folder: ImageFolder, ext: "webp" | "jpg") {
  return `${groupId}/${folder}/${crypto.randomUUID()}.${ext}`;
}

// The small copy that sits next to every full-size image
export function thumbPath(path: string) {
  return path.replace(/\.(webp|jpg)$/, "-thumb.$1");
}
