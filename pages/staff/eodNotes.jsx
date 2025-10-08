"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";

const EodNotePad = () => {
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  const token = localStorage.getItem("userToken");

  const handleAddNote = async () => {
    if (!note.trim()) return alert("Please enter a note");

    try {
      const res = await axios.post(
        "/api/staff/addEodNote",
        { note },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotes(res.data.eodNotes);
      setNote("");
      alert("EOD note added successfully!");
    } catch (error) {
      alert(error.response?.data?.message || "Error adding note");
    }
  };

  const fetchNotes = async (date = "") => {
    try {
      const res = await axios.get(`/api/staff/getEodNotes${date ? `?date=${date}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotes(res.data.eodNotes || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    fetchNotes(newDate);
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-4 bg-white rounded-xl shadow">
      <h2 className="text-xl font-bold mb-4 text-gray-800">🗒️ EOD Notes</h2>

      <textarea
        className="w-full border rounded-md p-3 mb-3 focus:outline-none focus:ring focus:ring-blue-200"
        rows="5"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Write your end-of-day note here..."
      ></textarea>

      <button
        onClick={handleAddNote}
        className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
      >
        Add Note
      </button>

      <div className="mt-6">
        <label className="block text-sm font-medium mb-2">📅 Filter by Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          className="border rounded-md p-2 w-full mb-4"
        />

        <h3 className="font-semibold mb-2">Previous Notes:</h3>
      <ul className="space-y-2">
  {notes.length > 0 ? (
    notes.map((n, i) => (
      <li key={i} className="p-3 border rounded-lg bg-gray-50">
        <p className="text-gray-700 whitespace-pre-wrap">{n.note}</p>
        <p className="text-xs text-gray-400">
          {new Date(n.createdAt).toLocaleString()}
        </p>
      </li>
    ))
  ) : (
    <p className="text-gray-500 text-sm">No notes found for this date.</p>
  )}
</ul>

      </div>
    </div>
  );
};

export default EodNotePad;
