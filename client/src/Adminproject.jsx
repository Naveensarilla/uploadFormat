import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
// import { useParams } from 'react-router-dom';

const Adminproject = () => {
    const [courses, setCourses] = useState([]);
    const [exams, setExams] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [units, setUnits] = useState([]);
    const [topics, setTopics] = useState([]);
    const [file, setFile] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('');
    const [selectedTopic, setSelectedTopic] = useState('');
    const [selectedTopicId, setSelectedTopicId] = useState(''); 
    // const { course_id } = useParams();

    useEffect(() => {
        axios.get('http://localhost:4007/quiz_coures/')
            .then((res) => {
                setCourses(res.data);
            })
            .catch((error) => {
                console.error('Error fetching courses:', error);
            });
    }, []);

    const fetchExams = (courseId) => {
        axios.get(`http://localhost:4007/quiz_exams/${courseId}`)
            .then((res) => {
                setExams(res.data);
            })
            .catch((error) => {
                console.error('Error fetching exams:', error);
            });
    };

    const fetchSubjects = (examId) => {
        axios.get(`http://localhost:4007/quiz_Subjects/${examId}`)
            .then((res) => {
                console.log('Subjects API Response:', res.data);
                setSubjects(res.data);
            })
            .catch((error) => {
                console.error('Error fetching subjects:', error);
            });
    };
   

    const fetchUnits = (subjectId) => {
        axios.get(`http://localhost:4007/quiz_units/${subjectId}`)
            .then((res) => {
                setUnits(res.data);
            })
            .catch((error) => {
                console.error('Error fetching units:', error);
            });
    };

    const fetchTopics = (unitId) => {
        axios.get(`http://localhost:4007/quiz_topics/${unitId}`)
            .then((res) => {
                setTopics(res.data);
            })
            .catch((error) => {
                console.error('Error fetching topics:', error);
            });
    };

    const handleCourseChange = (event) => {
        const courseId = event.target.value;
        setSelectedCourse(courseId);
        setSelectedExam('');
        setSelectedSubject('');
        setSelectedUnit('');
        setSelectedTopic('');
        fetchExams(courseId);
    };

    const handleExamChange = (event) => {
        const examId = event.target.value;
        setSelectedExam(examId);
        setSelectedSubject('');
        setSelectedUnit('');
        setSelectedTopic('');
        fetchSubjects(examId);
    };

    const handleSubjectChange = (event) => {
        const subjectId = event.target.value;
        setSelectedSubject(subjectId);
        setSelectedUnit('');
        setSelectedTopic('');
        fetchUnits(subjectId);
    };

    const handleUnitChange = (event) => {
        const unitId = event.target.value;
        setSelectedUnit(unitId);
        setSelectedTopic('');
        fetchTopics(unitId);
    };
    const handleTopicChange = (event) => {
        const selectedTopicId = event.target.value;
        setSelectedTopicId(selectedTopicId);
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
      };
    
      const handleUpload = () => {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('topic_id', selectedTopicId);
        fetch('http://localhost:4007/upload', {
          method: 'POST',
          body: formData,
        })
          .then((response) => response.text())
          .then((result) => {
            console.log(result);
            alert('suscefully uploded Document')
          })
          .catch((error) => {
            console.error(error);
          });
      };
    
    return (
        <div>
            <FormControl sx={{ m: 1, minWidth: 120 }}>
                <Select
                    value={selectedCourse}
                    onChange={handleCourseChange}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Without label' }}
                >
                    <MenuItem value="">
                        <em>Select the Course</em>
                    </MenuItem>
                    {courses.map((course) => (
                        <MenuItem key={course.course_id} value={course.course_id}>
                            {course.course_name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl sx={{ m: 1, minWidth: 120 }}>
                <Select
                    value={selectedExam}
                    onChange={handleExamChange}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Without label' }}
                >
                    <MenuItem value="">
                        <em>Select the Exam</em>
                    </MenuItem>
                    {exams.map((exam) => (
                        <MenuItem key={exam.exam_id} value={exam.exam_id}>
                            {exam.exam_name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl sx={{ m: 1, minWidth: 120 }}>
                <Select
                    value={selectedSubject}
                    onChange={handleSubjectChange}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Without label' }}
                >
                    <MenuItem value="">
                        <em>Select the Subject</em>
                    </MenuItem>
                    {subjects.map((subject) => (
                        <MenuItem key={subject.subi_id} value={subject.subi_id}>
                            {subject.subject_name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl sx={{ m: 1, minWidth: 120 }}>
                <Select
                    value={selectedUnit}
                    onChange={handleUnitChange}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Without label' }}
                >
                    <MenuItem value="">
                        <em>Select the Unit</em>
                    </MenuItem>
                    {units.map((unit) => (
                        <MenuItem key={unit.unit_id} value={unit.unit_id}>
                            {unit.unit_name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl sx={{ m: 1, minWidth: 120 }}>
                <Select
                    value={selectedTopic}
                    onChange={handleTopicChange}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Without label' }}
                >
                    <MenuItem value="">
                        <em>Select the Topic</em>
                    </MenuItem>
                    {topics.map((topic) => (
                        <MenuItem key={topic.topic_id} value={topic.topic_id}>
                            {topic.topic_name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <h1>Document Image Uploader</h1>
            <input type="file" accept=".docx" onChange={handleFileChange} />
             <button onClick={handleUpload}>Upload</button>
           <div>
           </div>
        </div>
    );
};

export default Adminproject ;
