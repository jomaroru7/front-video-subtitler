import React, { useState } from "react";

interface SubtitleHandlerProps {
  encodedSubtitles: string;
  onDecoded: (url: string) => void;
}

const SubtitleHandler: React.FC<SubtitleHandlerProps> = ({ encodedSubtitles, onDecoded }) => {
  const [decodedSubtitles, setDecodedSubtitles] = useState<string | null>(null);

  const decodeSubtitles = (base64Str: string) => {
    try {
      return atob(base64Str);
    } catch (error) {
      console.error("Error decodificando subtítulos:", error);
      return "";
    }
  };

  const generateSRTFile = (srtContent: string) => {
    const blob = new Blob([srtContent], { type: "text/plain" });
    return URL.createObjectURL(blob);
  };

  const handleDecode = () => {
    const srtText = decodeSubtitles(encodedSubtitles);
    setDecodedSubtitles(srtText);
    const srtUrl = generateSRTFile(srtText);
    onDecoded(srtUrl);
  };

  return (
    <div>
      <button onClick={handleDecode} className="bg-blue-500 text-white px-4 py-2 rounded">
        Cargar Subtítulos
      </button>
      {decodedSubtitles && <p>Subtítulos listos para usar 🎉</p>}
    </div>
  );
};

export default SubtitleHandler;
