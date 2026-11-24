// Any address that matches no page -> the 404 page above (in the right language).
import { notFound } from "next/navigation";

export default function Missing() {
  notFound();
}
