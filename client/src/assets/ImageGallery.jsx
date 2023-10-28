import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ImageGallery() {
  const [questionImages, setQuestionImages] = useState([]);
  const [optionImages, setOptionImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  useEffect(() => {
    // Fetch all question images
    axios.get('http://localhost:4007/questions')
      .then((response) => {
        setQuestionImages(response.data);
      })
      .catch((error) => {
        console.error('Error fetching question images:', error);
      });
  
    // Fetch all option images
    axios.get('http://localhost:4007/options')
      .then((response) => {
        setOptionImages(response.data);
      })
      .catch((error) => {
        console.error('Error fetching option images:', error);
      });
  }, []);

  const handleImageClick = (imageData) => {
    setSelectedImage(imageData);
  };

  return (
    <div>
      <h1>Image Gallery</h1>

      <h2>Question Images</h2>
      <div className="image-list">
        {questionImages.map((image, index) => (
          <div key={index} className="image-item">
            <p>Image {index + 1}</p>
            <img
              src={`data:image/png;base64,${image.question_data}`}
              alt={`Image ${index}`}
              onClick={() => handleImageClick(image)}
            />
          </div>
        ))}
      </div>

      <h2>Option Images</h2>
      <div className="image-list">
        {optionImages.map((image, index) => (
          <div key={index} className="image-item">
            <p>Image {index + 1}</p>
            <img
              src={`data:image/png;base64,${image.option_data}`}
              alt={`Image ${index}`}
              onClick={() => handleImageClick(image)}
            />
          </div>
        ))}
      </div>

      {selectedImage && (
        <div className="selected-image">
          <img
            src={`data:image/png;base64,${selectedImage.option_data || selectedImage.question_data}`}
            alt="Selected Image"
          />
        </div>
      )}
    </div>
  );
}

export default ImageGallery;
