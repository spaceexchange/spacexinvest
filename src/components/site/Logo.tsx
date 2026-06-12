import logoAsset from "@/assets/spacex-ipo-logo.jpg";

export function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <img
      src={logoAsset}
      alt="SpaceX IPO Exchange"
      className={`${className} object-contain`}
      width={64}
      height={64}
    />
  );
}
