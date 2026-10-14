'use client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faComment,
  faUserFriends,
  faUsers,
  faCog,
} from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';

// Import the components
import History from '../components/History';
import Settings from '../components/Settings';
import Friends from '../components/Friends';
import Groups from '../components/Groups';
import Chat from '../components/Chat';
import EditProfile from '../components/EditProfile';
import API_URL from '../../../predefineVar';
import axiosInstance from '../../../Config/axiosConfig';

export default function Home() {
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [activeView, setActiveView] = useState('History');
  const [userInfo, setUserInfo] = useState({});
  const [isAnimatingView, setIsAnimatingView] = useState(false); 
  const [isAnimatingChat, setIsAnimatingChat] = useState(false); 

  const chats = [
    { name: 'Camrina', message: "I'm looking to work with designer that..", date: '03 Mar', unread: 6 },
    // ... other chat data
  ];

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userinfo = await axiosInstance.get('/userInfo');
        setUserInfo(userinfo.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchUserInfo();
  }, []);

  const handleSelectFriend = (friend,friendId) => {
    setIsAnimatingChat(true); // Start chat animation
    setSelectedFriend(friend,friendId);

    // Reset chat animation state after duration
    setTimeout(() => {
      setIsAnimatingChat(false);
    }, 600);
  };

  const handleProfileUpdate = (updatedUserInfo) => {
    setUserInfo(updatedUserInfo);
  };

  const handleViewChange = (view) => {
    setIsAnimatingView(true); // Start view change animation
    setActiveView(view);

    // Reset view animation state after duration
    setTimeout(() => {
      setIsAnimatingView(false);
    }, 600);
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'History':
        return <History onSelectFriend={handleSelectFriend}  />;
      case 'Settings':
        return <Settings />;
      case 'Friends':
        return <Friends onSelectFriend={handleSelectFriend} />;
      case 'Groups':
        return <Groups />;
      case 'Profile':
        return <EditProfile userInfo={userInfo} onUpdateUserInfo={handleProfileUpdate} />  
      default:
        return <Chat chats={chats} />;
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes slideView {
            0% {
              transform: translateX(600px);
              opacity: 0;
            }
            100% {
              transform: translateX(0);
              opacity: 1;
            }
          }

          @keyframes slideChat {
            0% {
              transform: translateX(600px);
              opacity: 0;
            }
            100% {
              transform: translateX(0);
              opacity: 1;
            }
          }

          .animate-view {
            animation: slideView 0.6s ease forwards; 
          }

          .animate-chat {
            animation: slideChat 0.6s ease forwards; 
          }
        `}
      </style>

      <div className="flex bg-gradient-to-b from-purple-500 to-blue-500 h-screen w-full">
        <div className="Side-Nav flex flex-col pt-16 gap-7 h-full w-[17%] py-5">
          <div className="flex flex-col justify-center items-center mb-4"
          onClick={() => handleViewChange('Profile')}
          >
            <img
              src={userInfo ? `http://${API_URL}:5000/api/${userInfo.profile}` : `https://via.placeholder.com/40?text=${userInfo.userName.charAt(0)}`}
              alt={userInfo.userName}
              className="w-20 h-20 rounded-full border-4 border-white"
            />
            <h1 className="font-bold text-2xl text-white">{userInfo.userName}</h1>
            <p className="text-white mb-6 text-xs">{userInfo.firstName} {userInfo.lastName}</p>
          </div>
          <ul className="flex flex-col space-y-4">
            {[
              { icon: faComment, label: 'History', view: 'History' },
              { icon: faUserFriends, label: 'Friends', view: 'Friends' },
              { icon: faUsers, label: 'Groups', view: 'Groups' },
              { icon: faCog, label: 'Settings', view: 'Settings' },
            ].map((item, index) => (
              <li
                key={index}
                className="flex items-center gap-2 text-white hover:text-purple-700 cursor-pointer"
                onClick={() => handleViewChange(item.view)}
              >
                <div
                  className={`active-option w-2 h-full rounded-3xl ${activeView === item.view ? 'opacity-100 bg-purple-700' : 'opacity-0'}`}
                ></div>
                <FontAwesomeIcon icon={item.icon} className="mr-2 w-5" />
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        <div className={`first-layer flex bg-white bg-opacity-50 h-full w-[83%] rounded-l-3xl ${isAnimatingView ? 'animate-view' : ''}`}>
          <div className={`second-layer second-layer flex w-[40%] h-full flex-col text-purple-900 px-5 py-11 overflow-auto no-scrollbar ${isAnimatingView ? 'animate-view' : ''}`}>
            {renderActiveView()}
          </div>

          {/* Chat Component */}
          {selectedFriend && (
            <div className={`third-layer active-chat flex w-[60%] z-1 bg-white bg-opacity-40 rounded-l-3xl h-full flex-col px-5 py-10 text-purple-900 ${isAnimatingChat ? 'animate-chat' : ''}`}>
              <Chat friend={selectedFriend}  userInfo={userInfo}/>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
