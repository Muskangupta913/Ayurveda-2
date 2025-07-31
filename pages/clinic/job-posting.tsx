import React, { useState } from 'react';
import axios from 'axios';

const qualifications = ['MBBS', 'BDS', 'BAMS', 'BHMS', 'MD', 'MS', 'PhD', 'Diploma', 'Other'];
const jobTypes = ['Full Time', 'Part Time', 'Internship'];
const departments = ['Software', 'Dental', 'Cardiology', 'Pathology', 'Administration', 'Radiology', 'General Medicine'];

const PostJobForm = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    department: '',
    qualification: '',
    jobType: '',
    location: '',
    jobTiming: '',
    skills: '',
    perks: '',
    languagesPreferred: '',
    description: '',
    noOfOpenings: '',
    salary: '',
    establishment: '',
      workingDays: '',
  });

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('clinicToken'); // or doctorToken based on role
      const payload = {
        ...formData,
        // Convert comma-separated strings to arrays
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        perks: formData.perks.split(',').map(p => p.trim()).filter(Boolean),
        languagesPreferred: formData.languagesPreferred.split(',').map(l => l.trim()).filter(Boolean),
        noOfOpenings: parseInt(formData.noOfOpenings),
      };

      const res = await axios.post('/api/job-postings/create', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('Job posted successfully!');
    } catch (err) {
      console.error(err);
      alert('Error posting job');
    }
  };

  return (
    <div className="p-6 border rounded shadow max-w-2xl mx-auto bg-white">
      <h2 className="text-2xl font-bold mb-4">Post a Job</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="companyName" placeholder="Company Name" onChange={handleChange} className="p-2 border rounded" />
        <input name="jobTitle" placeholder="Job Title" onChange={handleChange} className="p-2 border rounded" />

        <select name="department" onChange={handleChange} className="p-2 border rounded">
          <option value="">Select Department</option>
          {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
        </select>

        <select name="qualification" onChange={handleChange} className="p-2 border rounded">
          <option value="">Select Qualification</option>
          {qualifications.map(q => <option key={q} value={q}>{q}</option>)}
        </select>

        <select name="jobType" onChange={handleChange} className="p-2 border rounded">
          <option value="">Select Job Type</option>
          {jobTypes.map(j => <option key={j} value={j}>{j}</option>)}
        </select>

        <input name="location" placeholder="Location" onChange={handleChange} className="p-2 border rounded" />
        <input name="jobTiming" placeholder="Job Timing" onChange={handleChange} className="p-2 border rounded" />
        <input name="salary" placeholder="Salary" onChange={handleChange} className="p-2 border rounded" />
        <input name="noOfOpenings" type="number" placeholder="No. of Openings" onChange={handleChange} className="p-2 border rounded" />
        <input name="establishment" placeholder="Establishment Year" onChange={handleChange} className="p-2 border rounded" />
      </div>

      <div className="mt-4">
        <textarea name="description" placeholder="Job Description" onChange={handleChange} className="p-2 border rounded w-full" rows={4} />
      </div>

      <div className="mt-4">
        <input name="skills" placeholder="Skills (comma separated)" onChange={handleChange} className="p-2 border rounded w-full" />
        <input name="perks" placeholder="Perks (comma separated)" onChange={handleChange} className="p-2 border rounded w-full mt-2" />
        <input name="languagesPreferred" placeholder="Languages Preferred (comma separated)" onChange={handleChange} className="p-2 border rounded w-full mt-2" />
      </div>
      <div className="mt-4">
  <label htmlFor="workingDays" className="font-medium block mb-2">Working Days</label>
  <input
    type="text"
    name="workingDays"
    placeholder="e.g. Monday–Friday"
    value={formData.workingDays}
    onChange={handleChange}
    className="p-2 border rounded w-full"
  />
</div>


      <button
        onClick={handleSubmit}
        className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        Submit Job
      </button>
    </div>
  );
};

export default PostJobForm;
