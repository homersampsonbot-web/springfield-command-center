export default function Head() {
  const v = process.env.NEXT_PUBLIC_BUILD_STAMP || "dev";
  // iOS is aggressive about caching startup images; querystring helps force refresh.
  const q = `?v=${encodeURIComponent(v)}`;
  return (
    <>
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="theme-color" content="#080810" />

      {/* iOS icons */}
      <link rel="apple-touch-icon" href={`/apple-touch-icon.png${q}`} />

      {/* iPhone 15 Pro (393x852 @3x => 1179x2556) */}
      <link rel="apple-touch-startup-image" href={`/splash/apple-splash-1179-2556.png${q}`} media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
      <link rel="apple-touch-startup-image" href={`/splash/apple-splash-2556-1179.png${q}`} media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />

      {/* Fallback splashes (common iPhones) */}
      <link rel="apple-touch-startup-image" href={`/splash/apple-splash-1284-2778.png${q}`} media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
      <link rel="apple-touch-startup-image" href={`/splash/apple-splash-1170-2532.png${q}`} media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
      <link rel="apple-touch-startup-image" href={`/splash/apple-splash-750-1334.png${q}`} media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
      <link rel="apple-touch-startup-image" href={`/splash/apple-splash-1536-2048.png${q}`} media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
    </>
  );
}
