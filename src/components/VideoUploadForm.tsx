import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import axios from "axios";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import DownloadButton from "./DownloadButton";

interface FormData {
  video: FileList;
}

const VideoUploadForm: React.FC = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [subtitlesBase64, setSubtitlesBase64] = useState<string | null>(null);
  const [subtitledVideoUrl, setSubtitledVideoUrl] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [response, setResponse] = useState<any | null>(null);
  const ffmpeg = new FFmpeg();

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setLoading(true);
    setResponse(null);
  
    try {
      const fileBase64 = await extractAudioToBase64(data.video[0]);
  
      const requestBody = {
        body: {
          audio: fileBase64.trim(),
          "sample_rate": "sr",
          "output_folder": "./tmp/"
        },
      };
  
      const res = await axios.post("http://127.0.0.1:4000/", requestBody, {
        headers: { "Content-Type": "application/json" },
      });
  
      console.log("Server Response:", res.data); // ✅ Ver qué responde el backend
  
      if (res.data && res.data.body && res.data.body.subtitles) {
        setResponse(res.data);
      } else {
        console.error("Error: Respuesta incompleta del servidor");
        setResponse({ error: "No se generaron los subtítulos correctamente." });
      }
    } catch (error: any) {
      console.error("Error uploading video:", error);
      setResponse(error.response?.data || { error: "An error occurred" });
    } finally {
      const file = data.video[0];
      const videoURL = URL.createObjectURL(file);
      setVideoFile(videoURL); 
      setLoading(false);
    }
  };
  

  const extractAudioToBase64 = async (file: File): Promise<string> => {
    if (!ffmpeg.loaded) {
      await ffmpeg.load({
        coreURL: "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js",
        wasmURL: "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.wasm",
      });
    }
  
    const fileData = new Uint8Array(await file.arrayBuffer());
    await ffmpeg.writeFile("input.mp4", fileData);
    await ffmpeg.exec(["-i", "input.mp4", "-q:a", "0", "-map", "a", "output.mp3"]);
    const audioData = await ffmpeg.readFile("output.mp3");
    const audioBlob = new Blob([audioData], { type: "audio/mp3" });
  
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        let base64String = reader.result as string;
  
        // 💡 Asegurar que el formato es correcto (eliminar "data:audio/mp3;base64,")
        const base64Clean = base64String.split(",")[1];
  
        // 💡 Verificar que la longitud sea válida (múltiplo de 4)
        if (base64Clean.length % 4 !== 0) {
          reject("Error: Base64 encoding incorrect (not a multiple of 4)");
        }
  
        resolve(base64Clean);
      };
      reader.onerror = () => reject("Error reading the audio file");
    });
  };
  
  const downloadSubtitledVideo = async () => {
    if (!videoFile || !response?.body?.subtitles) return;
    const subtitlesDecoded = atob(response.body.subtitles); // Decodificar Base64
    console.log("Subtítulos decodificados:", subtitlesDecoded);
    
    console.log("Iniciando descarga de video subtitulado...");
  
    if (!ffmpeg.loaded) {
      console.log("Cargando FFmpeg...");
      await ffmpeg.load({
        coreURL: "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js",
        wasmURL: "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.wasm",
      });
      console.log("FFmpeg cargado.");
    }
  
    // Guardar archivos en FFmpeg
    console.log("Descargando archivo de video...");
    const videoData = new Uint8Array(await (await fetch(videoFile)).arrayBuffer());
    await ffmpeg.writeFile("input.mp4", videoData);
    console.log("Archivo de video guardado en FFmpeg.");
  
    console.log("Decodificando subtítulos...");
    const subtitlesText = atob(response.body.subtitles); // Decodificar Base64
    await ffmpeg.writeFile("subtitles.srt", new TextEncoder().encode(subtitlesText));
    console.log("Archivo de subtítulos guardado en FFmpeg.");
  
    // Combinar video y subtítulos en un nuevo archivo
    console.log("Combinando video y subtítulos...");
    try {
      console.log("Ejecutando FFmpeg para combinar video y subtítulos...");
      await ffmpeg.exec(["-y","-i", "input.mp4", "-vf", "subtitles=subtitles.srt", "output.mp4"]);
      // await ffmpeg.exec(["-i", "input.mp4", "-vf", "subtitles=subtitles.srt", "output.mp4"]);

      console.log("FFmpeg ha terminado de combinar video y subtítulos.");
    } catch (error) {
      console.error("Error al ejecutar FFmpeg:", error);
    }
    console.log("Video y subtítulos combinados.");
  
    // Obtener el archivo final
    console.log("Leyendo archivo final...");
    const output = await ffmpeg.readFile("output.mp4");
    console.log("Archivo final leído.");
  
    const blob = new Blob([output], { type: "video/mp4" });
    const downloadURL = URL.createObjectURL(blob);
  
    // Crear un enlace de descarga
    const link = document.createElement("a");
    link.href = downloadURL;
    link.download = "video_subtitulado.mp4";
    document.body.appendChild(link);
    link.click();
    console.log("descarga")
  };
  

  const generateSubtitledVideo = async (file: File, base64Srt: string) => {
    const srtText = atob(base64Srt);
    const srtBlob = new Blob([srtText], { type: "text/plain" });

    if (!ffmpeg.loaded) {
      await ffmpeg.load({
        coreURL: "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js",
        wasmURL: "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.wasm",
      });
    }

    const videoData = new Uint8Array(await file.arrayBuffer());
    const srtData = new Uint8Array(await srtBlob.arrayBuffer());

    await ffmpeg.writeFile("input.mp4", videoData);
    await ffmpeg.writeFile("subtitles.srt", srtData);

    await ffmpeg.exec([
      "-i", "input.mp4",
      "-vf", "subtitles=subtitles.srt",
      "-c:a", "copy",
      "output.mp4"
    ]);

    const subtitledVideoData = await ffmpeg.readFile("output.mp4");
    const subtitledVideoBlob = new Blob([subtitledVideoData], { type: "video/mp4" });

    setSubtitledVideoUrl(URL.createObjectURL(subtitledVideoBlob));
  };

  return (
    <div className="max-w-lg mx-auto p-6 border rounded-lg shadow-lg bg-white">
      <h1 className="text-xl font-bold mb-4 text-gray-800">Upload Video</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="file" accept="video/*" {...register("video", { required: true })} />
        <button type="submit" className="bg-indigo-600 text-white py-2 px-4 rounded" disabled={loading}>
          {loading ? "Processing..." : "Upload Video"}
        </button>
      </form>

      {response?.body?.subtitles && videoFile && (
        <button
          onClick={downloadSubtitledVideo}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 mt-2"
        >
          Descargar Video con Subtítulos
        </button>
      )}


      {subtitlesBase64 && (
        <DownloadButton fileUrl={`data:text/plain;base64,${subtitlesBase64}`} fileName="subtitles.srt" label="Descargar Subtítulos" />
      )}
    </div>
  );
};

export default VideoUploadForm;
