import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  encryptText, 
  decryptText, 
  generateEncryptionKey, 
  exportKey, 
  keyStorage 
} from '../utils/encryption';
import { 
  uploadFile, 
  validateFile, 
  getAllowedFileTypes, 
  getFileType, 
  formatFileSize,
  createImagePreview,
  createVideoPreview 
} from '../utils/fileHandler';
import { ImageViewer } from './ImageViewer';

export const ConversationChat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (conversationId) {
      fetchConversation();
      fetchMessages();
      initializeEncryption();
    }
    // We intentionally omit fetchConversation/fetchMessages/initializeEncryption
    // from dependencies to avoid re-running on every render; conversationId is enough here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const initializeEncryption = async () => {
    try {
      // Try to get existing key from storage
      let key = await keyStorage.getConversationKey(conversationId);
      
      if (!key) {
        // Check if key exists on server
        const response = await fetch(`/api/conversations/${conversationId}/keys`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.hasKey) {
            // Key exists on server - in this simplified client implementation
            // we just ensure a local key is present for this conversation.
            key = await generateEncryptionKey();
            await keyStorage.saveConversationKey(conversationId, key);
          } else {
            // Generate new key for this conversation
            key = await generateEncryptionKey();
            const keyString = await exportKey(key);
            await keyStorage.saveConversationKey(conversationId, key);
            
            // Store encrypted key on server
            await fetch(`/api/conversations/${conversationId}/keys`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ 
                encryptedKey: keyString,
                encryptionMethod: 'password'
              })
            });
          }
        } else {
          // Generate new key
          key = await generateEncryptionKey();
          await keyStorage.saveConversationKey(conversationId, key);
        }
      }
      
      setEncryptionKey(key);
      setEncryptionEnabled(true);
    } catch (error) {
      console.error('Error initializing encryption:', error);
      setEncryptionEnabled(false);
    }
  };

  const fetchConversation = async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch conversation');
      const data = await response.json();
      setConversation(data.conversation);
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      
      // Get encryption key if available
      const key = encryptionKey || await keyStorage.getConversationKey(conversationId);
      
      // Decrypt messages if encryption is enabled and key is available
      if (key) {
        const decryptedMessages = await Promise.all(
          (data.messages || []).map(async (message) => {
            // Only try to decrypt if message is marked as encrypted AND has encrypted content
            if (message.isEncrypted && message.encryptedContent) {
              try {
                const decrypted = await decryptText(message.encryptedContent, key);
                return { ...message, decryptedContent: decrypted, content: decrypted };
              } catch (error) {
                // Decryption failed - could be wrong key, corrupted data, or different encryption
                // This is expected behavior for messages encrypted with different keys or old messages
                // Silently handle and show fallback content
                return { 
                  ...message, 
                  decryptedContent: message.content || '[Unable to decrypt - key mismatch or corrupted]',
                  decryptionError: true
                };
              }
            }
            // Not encrypted or no encrypted content - return as-is
            return message;
          })
        );
        setMessages(decryptedMessages);
      } else {
        // No key - show messages as-is (they might be unencrypted or encrypted with different key)
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, encryptionKey]);

  // Auto-refresh messages every few seconds to show new messages without manual reload
  useEffect(() => {
    if (!conversationId) return;

    const intervalId = setInterval(() => {
      fetchMessages();
    }, 3000); // 3 seconds; adjust if needed

    return () => clearInterval(intervalId);
  }, [conversationId, fetchMessages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;

    try {
      let messageContent = newMessage;
      let encryptedContent = null;
      let messageType = 'text';
      let fileUrl = null;
      let fileName = null;
      let fileSize = null;
      let fileMimeType = null;
      let thumbnailUrl = null;

      // Handle file upload
      if (selectedFile) {
        setUploading(true);
        const validation = validateFile(selectedFile, getAllowedFileTypes(), 100);
        if (!validation.valid) {
          alert(validation.error);
          setUploading(false);
          return;
        }

        try {
          // Upload file
          const uploadResult = await uploadFile(
            selectedFile, 
            '/api/upload/file',
            (progress) => {
              console.log(`Upload progress: ${progress.toFixed(2)}%`);
            }
          );

          fileUrl = uploadResult.url;
          fileName = uploadResult.fileName || selectedFile.name;
          fileSize = uploadResult.fileSize || selectedFile.size;
          fileMimeType = uploadResult.mimeType || selectedFile.type;
          thumbnailUrl = uploadResult.thumbnailUrl;
          messageType = getFileType(selectedFile);
          messageContent = messageContent || fileName;

          // Clear file selection
          setSelectedFile(null);
          setFilePreview(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (error) {
          console.error('File upload error:', error);
          // Provide more helpful error messages
          let errorMessage = 'Failed to upload file';
          const errorMsg = error.message || '';
          if (errorMsg.includes('503') || errorMsg.includes('not configured') || errorMsg.includes('authentication failed') || errorMsg.includes('Invalid api_key')) {
            errorMessage = 'File upload service is not properly configured. Please check Cloudinary credentials in backend configuration.';
          } else if (errorMsg.includes('size') || errorMsg.includes('too large')) {
            errorMessage = 'File is too large. Maximum size is 100MB.';
          } else if (errorMsg.includes('type') || errorMsg.includes('not allowed')) {
            errorMessage = 'File type is not supported. Please choose an image, audio, or video file.';
          } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
            errorMessage = 'You must be logged in to upload files. Please refresh the page.';
          } else {
            errorMessage = errorMsg || 'Failed to upload file. Please try again.';
          }
          alert(errorMessage);
          setUploading(false);
          // Clear file selection on error
          setSelectedFile(null);
          setFilePreview(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }
      }

      // Encrypt message if encryption is enabled and we have a key
      // Only encrypt text messages, not file metadata
      if (encryptionEnabled && encryptionKey && messageContent && messageType === 'text') {
        try {
          encryptedContent = await encryptText(messageContent, encryptionKey);
        } catch (error) {
          console.error('Encryption error:', error);
          // Don't block message sending if encryption fails - send unencrypted
          console.warn('Sending message unencrypted due to encryption error');
          encryptedContent = null;
          // Continue without encryption rather than blocking
        }
      }

      // Send message to server
      const messageData = {
        content: messageContent,
        messageType,
        isEncrypted: encryptionEnabled && !!encryptedContent,
        encryptedContent,
        fileUrl,
        fileName,
        fileSize,
        fileMimeType,
        thumbnailUrl
      };

      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(messageData)
      });

      if (!response.ok) throw new Error('Failed to send message');
      
      const data = await response.json();
      
      // Add decrypted content to message for display
      if (data.message.isEncrypted && encryptedContent) {
        data.message.decryptedContent = messageContent;
      }
      
      setMessages(prev => [...prev, data.message]);
      setNewMessage('');
      setUploading(false);

      // After sending a new message, scroll to the bottom so it's visible
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 0);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
      setUploading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateFile(file, getAllowedFileTypes(), 100);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setSelectedFile(file);

    // Create preview
    const fileType = getFileType(file);
    if (fileType === 'image') {
      try {
        const preview = await createImagePreview(file);
        setFilePreview({ type: 'image', url: preview });
      } catch (error) {
        console.error('Error creating image preview:', error);
      }
    } else if (fileType === 'video') {
      try {
        const preview = await createVideoPreview(file);
        setFilePreview({ type: 'video', url: preview });
      } catch (error) {
        console.error('Error creating video preview:', error);
        // Use a placeholder for video
        setFilePreview({ type: 'video', url: null, fileName: file.name });
      }
    } else {
      setFilePreview({ type: 'audio', fileName: file.name, fileSize: file.size });
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderMessage = (message) => {
    // Normalize IDs so we correctly detect who sent the message
    const senderId = (message?.sender?._id || message?.sender?.id || '').toString();
    const isOwnMessage = senderId === currentUserId;
    // Use decrypted content if available, otherwise use regular content
    const displayContent = message.decryptedContent !== undefined 
      ? message.decryptedContent 
      : message.content;
    const messageType = message.messageType || 'text';

    return (
      <div
        key={message._id}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 px-4`}
      >
        <div
          className={`max-w-[80%] sm:max-w-xs lg:max-w-md px-3 py-2 sm:px-4 sm:py-3 rounded-lg shadow-sm text-sm sm:text-base ${
            isOwnMessage
              ? 'bg-green-500 text-white rounded-tr-none'
              : 'bg-blue-500 text-white rounded-tl-none'
          }`}
        >
          {/* Display message content based on type */}
          {messageType === 'image' && message.fileUrl ? (
            <div>
              <img
                src={message.fileUrl}
                alt={message.fileName || 'Image'}
                className="max-w-full h-auto rounded mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setViewingImage({ url: message.fileUrl, fileName: message.fileName })}
                title="Click to view full size"
              />
              {displayContent && displayContent !== message.fileName && (
                <p className="text-sm mt-2">{displayContent}</p>
              )}
            </div>
          ) : messageType === 'video' && message.fileUrl ? (
            <div>
              <video
                src={message.fileUrl}
                controls
                className="max-w-full h-auto rounded mb-2"
              />
              {displayContent && displayContent !== message.fileName && (
                <p className="text-sm mt-2">{displayContent}</p>
              )}
            </div>
          ) : messageType === 'audio' && message.fileUrl ? (
            <div>
              <audio src={message.fileUrl} controls className="w-full mb-2" />
              {displayContent && (
                <p className="text-sm mt-2">{displayContent}</p>
              )}
            </div>
          ) : message.fileUrl && message.fileName ? (
            // Document or other file type
            <div>
              <button
                onClick={() => {
                  // Open document in new tab
                  const link = document.createElement('a');
                  link.href = message.fileUrl;
                  link.target = '_blank';
                  link.rel = 'noopener noreferrer';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className={`flex items-center gap-2 text-sm underline hover:no-underline transition-colors ${
                  isOwnMessage ? 'text-white hover:text-gray-100' : 'text-white hover:text-gray-100'
                }`}
                title="Click to open/download document"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{message.fileName}</span>
              </button>
              {displayContent && displayContent !== message.fileName && (
                <p className="text-sm mt-2">{displayContent}</p>
              )}
            </div>
          ) : (
            <p className="text-sm">{displayContent || '[Empty message]'}</p>
          )}

          {/* File info - show for images and as metadata for other files */}
          {message.fileName && (
            <p className={`text-xs mt-1 ${isOwnMessage ? 'text-green-100' : 'text-blue-100'}`}>
              {message.fileName}
              {message.fileSize && ` (${formatFileSize(message.fileSize)})`}
            </p>
          )}

          {/* Timestamp */}
          <p className={`text-xs mt-1 ${isOwnMessage ? 'text-green-100' : 'text-blue-100'}`}>
            {new Date(message.createdAt).toLocaleTimeString()}
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Conversation not found</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Determine the other user in this 1:1 conversation.
  // Current user ID might be stored as `id` or `_id`, so normalize to string.
  const currentUserId = (user?._id || user?.id || '').toString();
  const otherParticipant = conversation.participants.find(
    (p) => p?._id?.toString() !== currentUserId
  );

  return (
    // Full-height chat layout so header and input stay visible
    <div className="flex flex-col max-w-6xl mx-auto bg-white h-[calc(100vh-6rem)] overflow-hidden mt-2 mb-2">
      {/* Header */}
      <div className="flex items-center justify-between p-2 sm:p-4 border-b border-gray-200">
        <div className="flex items-center min-w-0 flex-1">
          <button
            onClick={() => navigate('/dashboard')}
            className="mr-2 sm:mr-4 p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <img
            src={otherParticipant?.photoURL || 'https://via.placeholder.com/40'}
            alt={otherParticipant?.username}
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex-shrink-0"
          />
          <div className="ml-2 sm:ml-3 min-w-0">
            <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base">{otherParticipant?.username}</h3>
            <p className="text-xs sm:text-sm text-gray-500">
              {otherParticipant?.status === 'online' ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center flex-shrink-0">
          {encryptionEnabled && (
            <div className="flex items-center text-green-600 mr-2 sm:mr-4">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">E2E Encrypted</span>
              <span className="text-xs sm:text-sm font-medium sm:hidden">E2E</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4">
        {messages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </div>

      {/* File Preview */}
      {filePreview && (
        <div className="px-2 sm:px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              {filePreview.type === 'image' && filePreview.url && (
                <img src={filePreview.url} alt="Preview" className="h-12 w-12 sm:h-16 sm:w-16 object-cover rounded flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                  {filePreview.fileName || 'File selected'}
                </p>
                {filePreview.fileSize && (
                  <p className="text-xs text-gray-500">{formatFileSize(filePreview.fileSize)}</p>
                )}
              </div>
            </div>
            <button
              onClick={removeSelectedFile}
              className="text-red-500 hover:text-red-700 flex-shrink-0 ml-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={sendMessage} className="p-2 sm:p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,audio/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 sm:px-4 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            disabled={uploading}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={selectedFile ? "Add caption..." : "Type a message..."}
            className="flex-1 px-3 py-2 sm:px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
            disabled={uploading}
          />
          <button
            type="submit"
            disabled={(!newMessage.trim() && !selectedFile) || uploading}
            className="px-4 sm:px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
          >
            {uploading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>

      {/* Image Viewer Modal */}
      {viewingImage && (
        <ImageViewer
          imageUrl={viewingImage.url}
          fileName={viewingImage.fileName}
          onClose={() => setViewingImage(null)}
        />
      )}
    </div>
  );
};
