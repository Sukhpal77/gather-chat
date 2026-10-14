import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../Config/axiosConfig'; 
import { format } from "timeago.js";
import API_URL from '../../../predefineVar';

export default function Chat({ onSelectFriend }) {
  const [friendschats, setFriendschats] = useState([]);

  useEffect(() => {
    const fetchChatList = async () => {
      try {
        const response = await axiosInstance.get('/recent-chats');
        setFriendschats(response.data); 
        console.log(response.data); 
      } catch (error) {
        console.error('Error fetching chat list:', error);
      }
    };
    fetchChatList();
  }, []);

  return (
    <div className="recent-chats flex w-full h-full flex-col text-purple-900 p-5">
      <div className="text-2xl font-bold mb-4">Chat</div>
      <input
        type="text"
        placeholder="Search"
        className="mb-4 p-2 rounded-lg bg-gray-100 focus:outline-none"
      />
      <ul className="space-y-4">
        {friendschats.map((friend, index) => (
          <li
            key={index}
            onClick={() => onSelectFriend({friend: friend, friendId: friend.friendId})}
            className="flex justify-between items-center p-2 rounded-lg cursor-pointer m-5 bg-white hover:bg-gray-100 transition"
          >
            <div className="flex items-center">
              <img
                src={friend.profile ? `http://${API_URL}:5000/api/${friend.profile}` : `https://via.placeholder.com/40?text=${friend.userName.charAt(0)}`} // Ensure the profile image URL is valid
                alt={`${friend.firstName} ${friend.lastName}`}
                className="rounded-full w-10 h-10 mr-3"
              />
              <div>
                <h2 className="font-bold">{friend.userName}</h2> {/* Displaying user's name */}
                <p className="text-sm text-gray-600 truncate w-40">{friend.message}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500">{format(friend.createdAt).toLocaleString()}</span> {/* Format date */}
              {parseInt(friend.unreadCount) > 0 && ( // Ensure unreadCount is a number
                <div className="bg-red-500 text-white rounded-full h-5 w-5 text-xs flex items-center justify-center">
                  {friend.unreadCount}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
