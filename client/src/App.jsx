import React, { useState } from 'react';

import './App.css';
import ImageList from './ImageList';
import Uploads from './Uploads';
function App() {
  const [file, setFile] = useState(null);
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };
  const handleUpload = () => {
    const formData = new FormData();
    formData.append('question_text', 'Your Question Text Here');
formData.append('answer_text', 'Your Answer Text Here');
    formData.append('document', file);
    fetch('http://localhost:5030/upload', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.text())
      .then((result) => {
        console.log(result);
      })
      .catch((error) => {
        console.error(error);
      });
  };
  return (
    <div className="App">
      {/* <h1>Document Image Uploader</h1>
      <input type="file" accept=".docx" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button> */}

<Uploads/>

      {/* <ImageList/> */}
    </div>
  );
}
 
export default App;

 