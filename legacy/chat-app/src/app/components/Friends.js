// components/Friends.js
import { useState, useEffect } from 'react';
import axiosInstance from '../../../Config/axiosConfig';
import API_URL from '../../../predefineVar';

export default function Friends({ onSelectFriend }) {
  const [friends, setFriends] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
 

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await axiosInstance.get('/friends');
      setFriends(response.data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await axiosInstance.get('/request');
      setFriendRequests(response.data);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const searchPeople = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await axiosInstance.get('/all', {
        params: { name: searchTerm },
      });
      setSearchResults(response.data);
      console.log(response.data);
    } catch (error) {
      console.error('Error searching for people:', error);
    }
  };

  const handleSendRequest = async (friendId) => {
    try {
      await axiosInstance.post('/friends', { friendId });
      fetchFriendRequests();
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleAcceptRequest = async (id) => {
    try {
      await axiosInstance.put(`/friends/${id}`, { status: 'accepted' });
      fetchFriends();
      fetchFriendRequests();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleUnfriend = async (id) => {  
    try {
      await axiosInstance.put(`/friends/${id}`, { status: 'cancel' });
      fetchFriends();
      fetchFriendRequests();
    } catch (error) {
      console.error('Error unfriending:', error);
    }
  };

  const handleCancelRequest = async (id) => {
    try {
      await axiosInstance.put(`/friends/cancelRequest/${id}`);
      fetchFriendRequests();
    } catch (error) {
      console.error('Error canceling friend request:', error);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    searchPeople();
  };

  return (
    <div className="friends-list flex w-full h-full flex-col text-purple-900 p-5">
      <div className="text-2xl font-bold mb-4">Friends</div>
      <input
        type="text"
        placeholder="Search for people..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="mb-4 p-2 rounded-lg bg-gray-100 focus:outline-none"
      />

      <ul className="space-y-4">
        <div className="font-bold text-xl">Search Results</div>
        {searchResults.map((person) => (
          <li
            key={person.id} 
            onClick={person.status === 'accepted' ? () => onSelectFriend({ friend: person, friendId: person.id }) : undefined}
            className="flex justify-between items-center p-2 rounded-lg cursor-pointer bg-white hover:bg-gray-100 transition"
          >
            <img
              src={person ? `http://${API_URL}:5000/api/${person.profile}` :`https://via.placeholder.com/40?text=${person.userName.charAt(0)}`}
              alt={person.userName}
              className="rounded-full w-10 h-10 mr-3"
            />
            <div>
              <h2 className="font-bold">{person.userName}</h2>
              <p className="text-sm text-gray-600">{person.firstName} {person.lastName}</p>
            </div>
            <button
              onClick={() =>
              person.status !='unfriended'
                ?person.status === 'pending'
                  ? handleCancelRequest(person.id)
                  : person.status === 'requested'
                  ? handleAcceptRequest(person.id)
                  : handleUnfriend(person.id)
                : handleSendRequest(person.id)
              }
              className={`p-2 rounded-lg text-white ${
                person.status !='unfriended'
                  ? person.status === 'pending'
                    ? 'bg-yellow-500'
                    : person.status === 'requested'
                    ? 'bg-green-500'
                    : 'bg-red-500'
                  : 'bg-blue-500'
              }`}
            >
              {person.status !='unfriended'
                ? person.status == 'pending'
                  ? 'Requested'
                  : person.status == 'requested'
                  ? 'Accept'
                  : 'Cancel'
                : 'Send Request'}
            </button>
          </li>
        ))}

        <div className="font-bold text-xl mt-4">Friend Requests</div>
        {friendRequests.map((request) => (
          <li
            key={request.id}
            className="flex justify-between items-center p-2 rounded-lg cursor-pointer bg-white hover:bg-gray-100 transition"
          >
            <img
              src={request ? `http://${API_URL}:5000/api/${request.user.profile}` :`https://via.placeholder.com/40?text=${request.user.userName.charAt(0)}`}
              alt={request.user.userName}
              className="rounded-full w-10 h-10 mr-3"
            />
            <div>
              <h2 className="font-bold">{request.user.userName}</h2>
              <p className="text-sm text-gray-600">{request.user.firstName} {request.user.lastName}</p>
            </div>
            <button
              onClick={() => handleAcceptRequest(request.id)}
              className="p-2 bg-green-500 text-white rounded-lg"
            >
              Accept
            </button>
          </li>
        ))}

        <div className="font-bold text-xl mt-4">Friends List</div>
        {friends.map((friend) => (
          <li
            key={friend.id}
            onClick={() => onSelectFriend({friend: friend, friendId: friend.friendId})}
            className="flex justify-between items-center p-2 rounded-lg cursor-pointer bg-white hover:bg-gray-100 transition"
          >
            <img
              src={friend ? `http://${API_URL}:5000/api/${friend.profile}` :`https://via.placeholder.com/40?text=${friend.userName.charAt(0)}`}
              alt={friend.userName}
              className="rounded-full w-10 h-10 mr-3"
            />
            <div>
              <h2 className="font-bold">{friend.userName}</h2>
              <p className="text-sm text-gray-600">{friend.firstName} {friend.lastName}</p>
            </div>
            <button
              onClick={() => handleUnfriend(friend.id)}
              className="p-2 bg-red-500 text-white rounded-lg"
            >
              Cancel
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
