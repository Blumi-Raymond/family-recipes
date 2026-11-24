// An image from Storage (signed URL), or a soft placeholder when there is none.
// A plain <img>: the images are already resized when uploaded, and their
// links are temporary, so Next.js image optimization adds nothing here.
export function Photo({
  src,
  alt,
  className = "",
  eager = false,
}: {
  src: string | null;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-brand-tint text-brand/50 ${className}`}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 11h16v2a7 7 0 0 1-7 7h-2a7 7 0 0 1-7-7v-2z" />
          <path d="M2 11h20" />
          <path d="M9 7c0-1.5 1-1.5 1-3" />
          <path d="M13 7c0-1.5 1-1.5 1-3" />
        </svg>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={`bg-brand-tint object-cover ${className}`}
    />
  );
}
