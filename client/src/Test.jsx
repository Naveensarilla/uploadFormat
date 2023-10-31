
import React, { useState, useEffect } from 'react';
import axios from 'axios';
 
function Test() {
  const [data, setData] = useState([]);
 
  useEffect(() => {
    // Make an API call to your backend
    axios.get('http://localhost:4007/data') // Replace with your actual API endpoint
      .then((response) => {
        setData(response.data);
        console.log(data)
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
      });
  }, []);
 
  return (
    <div>
      <h1>Data Display</h1>
      <ul>
        {data.map((item) => (
          <li key={item.test_id}>
            {item.test} - {item.subject_name} -
            {item.question_data && (
              <img
                src={`data:image/png;base64,${item.question_data}`}
                alt="questions"
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
 
export default Test;