import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function ShopQr({ url, size = 280 }: { url: string; size?: number }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(url, {
      width: size,
      margin: 1,
      color: { dark: "#1c1915", light: "#f3eee6" },
    }).then((data) => {
      if (!cancelled) setSrc(data);
    });
    return () => {
      cancelled = true;
    };
  }, [url, size]);

  if (!src) {
    return <div className="mx-auto aspect-square w-full max-w-xs animate-pulse rounded-xl bg-secondary" />;
  }
  return (
    <img
      src={src}
      alt="Scan to leave your number"
      className="mx-auto aspect-square w-full max-w-xs rounded-xl border border-border bg-card p-2"
    />
  );
}
