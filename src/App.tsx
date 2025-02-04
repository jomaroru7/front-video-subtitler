
import './App.css'
import TitleBanner from './components/TitleBanner'
import VideoUploadForm from './components/VideoUploadForm'

function App() {

  return (
    <>
      <div className='bg-gray-800 min-h-screen w-screen flex flex-col justify-center items-center'>
        <TitleBanner/>
        <VideoUploadForm/>
      </div>  
    </>
    
  )
}

export default App
