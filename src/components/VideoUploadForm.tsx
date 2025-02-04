import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import axios from "axios";
import { FFmpeg } from "@ffmpeg/ffmpeg";

interface FormData {
  video: FileList;
}

const VideoUploadForm: React.FC = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const ffmpeg = new FFmpeg();

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    const file = data.video[0];
    if (!file) {
      console.error("No file selected");
      return;
    }

    setLoading(true);

    try {
      const fileBase64 = await extractAudioToBase64(file);

      const requestBody = {
        body: {
          audio: fileBase64,
          "sample_rate": "sr", 
          "output_folder": "./tmp/"
        },
      };

      const res = await axios.post("http://127.0.0.1:4000/", requestBody, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      setResponse(res.data);
      reset();
    } catch (error: any) {
      console.error("Error uploading video:", error);
      setResponse(error.response?.data || { error: "An error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const extractAudioToBase64 = async (file: File): Promise<string> => {
    console.log("Archivo recibido:", file.name);
  
    if (!ffmpeg.loaded) {
      console.log("Cargando FFmpeg");
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm";
  
      try {
        await ffmpeg.load({
          coreURL: `${baseURL}/ffmpeg-core.js`,
          wasmURL: `${baseURL}/ffmpeg-core.wasm`,
        });
  
        console.log("FFmpeg cargado correctamente");
      } catch (error) {
        console.error("Error al cargar FFmpeg:", error);
        throw new Error("Error al cargar FFmpeg");
      }
    }
  
    try {
      console.log("Convirtiendo archivo a Uint8Array...");
      const fileData = new Uint8Array(await file.arrayBuffer());
      console.log("Archivo convertido correctamente");
  
      console.log("Escribiendo archivo en FFmpeg...");
      await ffmpeg.writeFile("input.mp4", fileData);
      console.log("Archivo escrito correctamente");
  
      console.log("Extrayendo audio...");
      await ffmpeg.exec(["-i", "input.mp4", "-q:a", "0", "-map", "a", "output.mp3"]);
      console.log("Audio extraído correctamente");
  
      console.log("Leyendo el archivo de audio...");
      const audioData = await ffmpeg.readFile("output.mp3");
  
      console.log("Creando Blob de audio...");
      const audioBlob = new Blob([audioData], { type: "audio/mp3" });
  
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          let base64String = reader.result as string;
  
          base64String = base64String.split(",")[1];
  
          console.log("Conversión a Base64 completada");
          resolve(base64String);
        };
      });
    } catch (error) {
      console.error("Error procesando el archivo:", error);
      throw new Error("Error al procesar el video");
    }
  };
  
  

  return (
    <div>
      <div className="max-w-lg mx-auto p-6 border rounded-lg shadow-lg bg-white">
        <h1 className="text-xl font-bold mb-4 text-gray-800">Upload Video</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="video" className="block text-sm font-medium text-gray-700">
              Select a video
            </label>
            <input
              type="file"
              id="video"
              accept="video/*"
              {...register("video", { required: "Please select a video file" })}
              className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.video && (
              <p className="text-sm text-red-600 mt-1">{errors.video.message}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          >
            {loading ? "Processing..." : "Upload Video"}
          </button>
        </form>

        {response && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <h2 className="text-lg font-bold text-gray-800">Response:</h2>
            <pre className="text-sm bg-gray-200 p-2 rounded-lg overflow-auto text-gray-800">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoUploadForm;