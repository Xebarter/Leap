'use client';

import { useEffect } from 'react';

interface PropertyVideoPlayerProps {
  videoUrl: string | null;
}

export function PropertyVideoPlayer({ videoUrl }: PropertyVideoPlayerProps) {
  // Function to extract YouTube video ID from URL
  const extractYouTubeId = (url: string) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Function to extract TikTok video ID from URL
  const extractTikTokId = (url: string) => {
    const regExp = /(tiktok\.com\/[^/]*\/video\/|vm\.tiktok\.com\/)([0-9]+)/;
    const match = url.match(regExp);
    return match && match[2] ? match[2] : null;
  };

  const isYouTube = videoUrl && extractYouTubeId(videoUrl);
  const isTikTok = videoUrl && extractTikTokId(videoUrl);

  useEffect(() => {
    // Load TikTok embed script if there's a TikTok URL
    if (isTikTok) {
      const scriptId = 'tiktok-embed-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://www.tiktok.com/embed.js';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, [isTikTok]);

  if (!videoUrl) return null;

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
      {isYouTube && (
        <iframe
          src={`https://www.youtube.com/embed/${extractYouTubeId(videoUrl)}`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 w-full h-full"
          allowFullScreen
        ></iframe>
      )}
      {isTikTok && (
        <div className="absolute inset-0 flex items-center justify-center">
          <blockquote 
            className="tiktok-embed mx-auto"
            cite={videoUrl}
            data-video-id={extractTikTokId(videoUrl) || undefined}
            style={{ maxWidth: "605px", minWidth: "325px", width: "100%" }}
          >
            <section></section>
          </blockquote>
        </div>
      )}
    </div>
  );
}