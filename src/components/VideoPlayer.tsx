import React from "react";

interface VideoPlayerProps {
  videoUrl: string;
  subtitlesUrl: string | null;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, subtitlesUrl }) => {
  return (
    <div>
      <video controls width="600">
        <source src={videoUrl} type="video/mp4" />
        {subtitlesUrl && (
          <track src={subtitlesUrl} kind="subtitles" srcLang="es" label="Español" default />
        )}
      </video>
    </div>
  );
};

export default VideoPlayer;
