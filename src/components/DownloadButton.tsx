import React from "react";

interface DownloadButtonProps {
  fileUrl: string | null;
  fileName: string;
  label: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ fileUrl, fileName, label }) => {
  const handleDownload = () => {
    if (!fileUrl) return;

    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <button onClick={handleDownload} disabled={!fileUrl} className="bg-green-500 text-white px-4 py-2 rounded mt-2">
      {label}
    </button>
  );
};

export default DownloadButton;
