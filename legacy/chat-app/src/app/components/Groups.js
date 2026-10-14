// components/Groups.js
import { useState } from 'react';

export default function Groups() {
  const [groups, setGroups] = useState([
    { name: 'React Developers', isMember: true },
    { name: 'UI/UX Designers', isMember: false },
    { name: 'Startup Enthusiasts', isMember: false },
  ]);
  const [newGroupName, setNewGroupName] = useState('');

  const handleCreateGroup = () => {
    if (newGroupName.trim() === '') return;

    setGroups([...groups, { name: newGroupName, isMember: true }]);
    setNewGroupName('');
  };

  const handleJoinGroup = (index) => {
    const updatedGroups = [...groups];
    updatedGroups[index].isMember = true;
    setGroups(updatedGroups);
  };

  return (
    <div className="groups-list flex w-full h-full flex-col text-purple-900 p-5">
      <div className="text-2xl font-bold mb-4">Groups</div>
      <input
        type="text"
        placeholder="Create a new group..."
        value={newGroupName}
        onChange={(e) => setNewGroupName(e.target.value)}
        className="mb-4 p-2 rounded-lg bg-gray-100 focus:outline-none"
      />
      <button onClick={handleCreateGroup} className="mb-4 p-2 bg-blue-500 text-white rounded-lg">Create Group</button>
      
      <ul className="space-y-4">
        {groups.map((group, index) => (
          <li
            key={index}
            className="flex justify-between items-center p-2 rounded-lg cursor-pointer bg-white hover:bg-gray-100 transition"
          >
            <div>
              <h2 className="font-bold">{group.name}</h2>
              <p className="text-sm text-gray-600">{group.isMember ? 'Member' : 'Not a Member'}</p>
            </div>
            {!group.isMember && (
              <button
                onClick={() => handleJoinGroup(index)}
                className="p-2 bg-green-500 text-white rounded-lg"
              >
                Join
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
