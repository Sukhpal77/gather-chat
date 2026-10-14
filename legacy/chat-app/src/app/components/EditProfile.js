import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import API_URL from '../../../predefineVar';
import axiosInstance from '../../../Config/axiosConfig';

export default function EditProfile({ userInfo, onUpdateUserInfo }) {
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState(userInfo);
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalProfile, setOriginalProfile] = useState(userInfo.profile);

  useEffect(() => {
    setProfileData(userInfo);
    setOriginalProfile(userInfo.profile);
  }, [userInfo]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setProfileData({ ...profileData, profile: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      let isUpdated = false;

      // Check if user data has changed
      Object.keys(profileData).forEach((key) => {
        if (profileData[key] !== userInfo[key]) {
          formData.append(key, profileData[key]);
          isUpdated = true;
        }
      });

      // Check if the profile picture has changed
      if (selectedFile) {
        formData.append('profile', selectedFile);
        isUpdated = true;
      } else if (originalProfile !== profileData.profile) {
        formData.append('profile', originalProfile); // If no new file but profile URL changed
        isUpdated = true;
      }

      // Only send data if there's something to update
      if (isUpdated) {
        const response = await axiosInstance.put('/updateProfile', formData);
        onUpdateUserInfo(response.data);
      }

      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const formattedDate = new Date(profileData.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="edit-profile flex flex-col items-center rounded-lg p-6">
      <div className="relative mb-4">
        <img
          src={
            profileData.profile
              ? profileData.profile.startsWith('data:')
                ? profileData.profile
                : `http://${API_URL}:5000/api/${profileData.profile}`
              : `https://via.placeholder.com/150?text=${profileData.userName.charAt(0)}`
          }
          alt={profileData.userName}
          className="w-32 h-32 rounded-full border-4 border-purple-800 object-cover"
        />
        {editMode && (
          <>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="absolute top-0 right-0 p-2 bg-purple-300 rounded-full cursor-pointer transition">
              <FontAwesomeIcon icon={faPencilAlt} className="text-purple-800" />
            </div>
          </>
        )}
      </div>
      <div className="w-full mb-4 test-center bg-purple-400 rounded-3xl">
        {editMode ? (
          <div className="flex flex-col py-2 px-4 overflow-auto no-scrollbar">
            <input
              type="text"
              name="userName"
              placeholder="userName"
              value={profileData.userName}
              onChange={handleInputChange}
              className="text-2xl px-9 font-bold my-1 text-center bg-transparent placeholder:text-purple-800  focus:outline-none focus:none border-b-2 border-purple-800"
            />
            <textarea
              name="bio"
              value={profileData.bio || ''}
              onChange={handleInputChange}
              placeholder="Bio"
              className=" w-full bg-transparent text-center placeholder:text-purple-800 focus:outline-none focus:none text-purple-800 border-b-2 border-purple-800  resize-none"
            />
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold my-2 text-center">{profileData.userName}</h2>
            <p className="mb-2 px-6"><span className="font-bold ">Bio:</span> {profileData.bio}</p>
          </>
        )}
      </div>

      <div className="mb-2 p-5 w-full bg-purple-400 rounded-3xl">
        <span className="font-bold inline-block">Name:</span>
        {editMode ? (
          <div className="flex space-x-2 pl-2 overflow-auto no-scrollbar">
            <input
              type="text"
              name="firstName"
              value={profileData.firstName}
              onChange={handleInputChange}
              placeholder="First Name"
              className=" flex-1 w-50 bg-transparent placeholder:text-purple-800 focus:outline-none border-b-2 border-purple-800"
            />
            <input
              type="text"
              name="lastName"
              value={profileData.lastName}
              onChange={handleInputChange}
              placeholder="Last Name"
              className=" flex-1 bg-transparent w-50 placeholder:text-purple-800 focus:outline-none border-b-2 border-purple-800"
            />
          </div>
        ) : (
          <span className="ml-2">{`${profileData.firstName} ${profileData.lastName}`}</span>
        )}
      </div>

      <div className="mb-2 p-5 w-full bg-purple-400 rounded-3xl"><span className="font-bold">Email:</span> {profileData.email}</div>

      <div className="mb-2 p-5 w-full bg-purple-400 rounded-3xl">
        <span className="font-bold">Mobile:</span>
        {editMode ? (
          <div className="flex space-x-2 pl-2 overflow-auto no-scrollbar">
            <input
              type="text"
              name="mobile"
              value={profileData.mobile}
              onChange={handleInputChange}
              placeholder="Mobile"
              className=" w-full  bg-transparent placeholder:text-purple-800  focus:outline-none focus:none border-b-2 border-purple-800"
            />
          </div>
        ) : (
          <span className="ml-2">{`${profileData.mobile}`}</span>
        )}
      </div>

      <div className="mb-2 p-5 w-full bg-purple-400 rounded-3xl">
        <span className="font-bold">Address:</span>
        {editMode ? (
          <div className="flex space-x-2 pl-2 overflow-auto no-scrollbar">
            <input
              type="text"
              name="address"
              value={profileData.address}
              onChange={handleInputChange}
              placeholder="Address"
              className=" w-full  bg-transparent placeholder:text-purple-800  focus:outline-none focus:none border-b-2 border-purple-800"
            />
          </div>
        ) : (
          <span className="ml-2">{`${profileData.address}`}</span>
        )}
      </div>

      <div className="mb-2 p-5 w-full bg-purple-400 rounded-3xl"><span className="font-bold">Joined:</span> {formattedDate}</div>


      {editMode ? (
        <div className="w-full flex justify-between gap-5 p-5">
          <button
            onClick={handleSave}
            className="bg-green-500 text-white p-2 rounded-lg w-full transition hover:bg-green-400"
          >
            Save
          </button>
          <button
            onClick={handleEditToggle}
            className="text-gray-50 p-2 rounded-lg w-full bg-red-500 hover:bg-red-400 transition"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={handleEditToggle}
          className="bg-purple-500 text-purple-800 mt-5 p-2 rounded-lg w-full hover:bg-purple-400 transition"
        >
          Edit Profile
        </button>
      )}
    </div>
  );
}
