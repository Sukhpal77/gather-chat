import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../../Config/axiosConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faPlay, faPause, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { io } from 'socket.io-client';
import { format } from "timeago.js";
import API_URL from '../../../predefineVar';
import InputEmoji from 'react-input-emoji';
import { set } from 'react-hook-form';

export default function Chat({ friend, userInfo }) {
    const [chats, setChats] = useState([]);
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [recording, setRecording] = useState(false);
    const [voiceBlob, setVoiceBlob] = useState(null);
    const [showRecordingOptions, setShowRecordingOptions] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const scrollRef = useRef();

    const socket = useRef();

    console.log(friend);

    useEffect(() => {
        socket.current = io("ws://192.168.1.50:8800");

        socket.current.on("connect", () => {
            console.log("Connected to WebSocket server:", socket.current.id);
            socket.current.emit("new-user-add", userInfo.id);

            socket.current.on("get-users", (users) => {
                setOnlineUsers(users);
            });
        });

        return () => {
            socket.current.disconnect();
        };
    }, [userInfo]);

    useEffect(() => {
        const fetchChatData = async () => {
            try {
                const response = await axiosInstance.get('/chats', { params: { friendId: friend.friendId } });
                setChats(response.data);
            } catch (error) {
                console.error('Error fetching chat data:', error);
            }
        };
        fetchChatData();
    }, [friend.friendId]);

    useEffect(() => {
        const handleReceiveMessage = (data) => {
            console.log('Received message:', data);
            setChats((prevChats) => [...prevChats, data]);
        };

        socket.current.on('receive-message', handleReceiveMessage);
        socket.current.on('typing', () => setIsTyping(true));
        socket.current.on('stopTyping', () => setIsTyping(false));

        return () => {
            socket.current.off('receive-message', handleReceiveMessage);
            socket.current.off('typing');
            socket.current.off('stopTyping');
        };
    }, [chats]);

    // Scroll to the last message
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chats]);

    const sendMessage = async () => {
        if (message.trim() === '') return;

        const newMessage = {
            message,
            friendId: friend.friendId,
            isUser: true,
            time: new Date().toISOString(),
        };

        try {
            socket.current.emit('send-message', newMessage);
            await axiosInstance.post('/send-message', { message, friendId: friend.friendId });
            setChats((prevChats) => [...prevChats, newMessage]);
            setMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleRecordVoice = async () => {
        if (!recording) {
            setRecording(true);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks);
                setVoiceBlob(audioBlob);
                sendVoiceMessage(audioBlob);
                setRecording(false);
            };

            mediaRecorder.start();

            // No timeout, user can record as long as they want
            mediaRecorder.onstart = () => {
                console.log('Recording started...');
            };
        }
    };

    const sendVoiceMessage = async (audioBlob) => {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob);
            formData.append('friendId', friend.friendId);
            await axiosInstance.post('/send-voice-message', formData);
            setChats((prevChats) => [
                ...prevChats,
                { message: 'Voice message sent', isUser: true, time: new Date().toLocaleTimeString() },
            ]);
        } catch (error) {
            console.error('Error sending voice message:', error);
        }
    };

    const handleTyping = () => {
        socket.current.emit('typing', { friendId: friend.friendId });
    };

    const handleStopTyping = () => {
        socket.current.emit('stopTyping', { friendId: friend.friendId });
    };

    const togglePlayPause = () => {
        setIsPlaying((prev) => !prev);
    };

    const handleToggleRecordingOptions = () => {
        setShowRecordingOptions((prev) => !prev);
    };

    const checkOnlineStatus = () => onlineUsers.some((user) => user.userId === friend.friendId);


    return (
        <div className="recent-chats flex flex-col h-full text-purple-900  overflow-auto no-scrollbar">
            <div className="flex items-center justify-between pb-4">
                <div className="flex justify-between items-center w-full p-2 rounded-lg cursor-pointer m-5 bg-white hover:bg-gray-100 transition">
                    <div className="flex flex-row items-center px-5 py-2 w-full">
                        <img
                            src={friend ? `http://${API_URL}:5000/api/${friend.friend.profile}` : `https://via.placeholder.com/40?text=${friend.friend.userName.charAt(0)}`}
                            alt={friend.friend.userName}
                            className="rounded-full w-20 h-20 mr-3"
                        />
                        <div className="flex flex-col pt-1">
                            <h2 className="font-bold text-purple-900">{friend.friend.firstName} {friend.friend.lastName}</h2>
                            <p className="text-sm text-purple-900  truncate w-40"><span className="text-purple-900">@</span>{friend.friend.userName}</p>
                            <p className="text-sm text-purple-900 truncate w-40">{friend.friend.bio}</p>
                        </div>
                        <div className="text-sm flex flex-row items-center text-gray-600 ml-auto">
                            {checkOnlineStatus() ? (
                                <>
                                    <div className="online-dot rounded-full bg-green-500 w-2 h-2"></div>
                                    <span className="ml-2 text-purple-900">Online</span>
                                </>
                            ) : (
                                <>
                                    <div className="online-dot rounded-full bg-orange-400 w-2 h-2"></div>
                                    <span className="ml-2 text-purple-900">Offline</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 rounded-lg">
                {chats.map((chat, index) => (
                    <div key={index} ref={scrollRef} className={`flex ${chat.isUser ? 'justify-end' : 'justify-start'} mb-4`}>
                        <div className={`${chat.isUser ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-l-lg rounded-tr-lg' : 'bg-gradient-to-l from-purple-200 to-purple-400 text-purple-900 rounded-r-lg rounded-tl-lg'} p-3 max-w-[70%]`}>
                            <p>{chat.message}</p>
                            <span className="text-[10px] text-gray-100 float-right">{format(chat.time)}</span>
                        </div>
                    </div>
                ))}
                {isPlaying && voiceBlob && (
                    <div className="flex justify-start mb-4">
                        <div className="voice-message bg-purple-200 p-3 rounded-lg max-w-[70%] flex items-center">
                            <button onClick={togglePlayPause} className="mr-2">
                                <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="text-purple-600" />
                            </button>
                            <audio controls src={URL.createObjectURL(voiceBlob)}></audio>
                            <span className="text-purple-900 ml-2">{isPlaying ? 'Playing...' : 'Paused'}</span>
                        </div>
                    </div>
                )}
                {isTyping && (
                    <div className="flex justify-start mb-2">
                        <div className="flex items-center">
                            <div className="bg-gray-300 rounded-full w-2 h-2 animate-bounce mr-1"></div>
                            <div className="bg-gray-300 rounded-full w-2 h-2 animate-bounce mr-1"></div>
                            <div className="bg-gray-300 rounded-full w-2 h-2 animate-bounce"></div>
                        </div>
                    </div>
                )}
                {/* Recording Options */}
                {showRecordingOptions && (
                    <div className="bg-gray-100 p-3 rounded-lg mb-4 animate-pulse">
                        <button onClick={handleRecordVoice} className="text-purple-600">
                            <FontAwesomeIcon icon={faMicrophone} className="mr-2" />
                            {recording ? 'Stop' : 'Record'}
                        </button>
                    </div>
                )}
            </div>
            <div className="mt-4 flex items-center px-4">
                <FontAwesomeIcon
                    icon={faMicrophone}
                    className={`text-gray-600 mx-2 w-4 cursor-pointer ${recording ? 'animate-pulse text-red-600' : ''}`}
                    onClick={handleToggleRecordingOptions}
                />
                <InputEmoji
                    value={message}
                    onChange={setMessage}
                    onFocus={handleTyping}
                    onBlur={handleStopTyping}
                    placeholder="Type Something..."
                />
                <button className="flex flex-row text-white items-center rounded-lg" onClick={sendMessage}>
                    <FontAwesomeIcon icon={faPaperPlane} className="text-blue-600 cursor-pointer w-4" />
                </button>
            </div>
        </div>
    );
}
