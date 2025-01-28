import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import axios from "axios";

interface FormData {
  video: FileList; 
}

const VideoUploadForm: React.FC = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();
  const [response, setResponse] = useState<any>(null);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    const file = data.video[0];
    if (!file) {
      console.error("No file selected");
      return;
    }

    try {
      const fileBase64 = await convertFileToBase64(file);

      const requestBody = {
        body: {
          video: file.name,
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
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
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
          >
            Upload Video
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
