import React, { useState, useEffect } from 'react';

function ImageList() {
  const [images, setImages] = useState([]);
  const id = 1; // Replace with the appropriate document ID

  useEffect(() => {
    // Fetch images from your Express API
    // fetch(`http://localhost:5030/images/${id}`)
    fetch(`http://localhost:5030/img`)

      .then((response) => response.json())
      .then((data) => setImages(data))
      .catch((error) => console.error('Error fetching images:', error));
  }, [id]);

  return (
    <div>
      <h1>Images</h1>
      {images.map((image, index) => (
        <div key={index}>
          <img
            src={`data:image/png;base64,${image.image_data}`}
            alt="Image"
          />
        </div>
      ))}
    </div>
  );
}

export default ImageList;
