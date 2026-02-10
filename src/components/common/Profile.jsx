import React, { useState, useEffect, useRef } from 'react';
import { FiUser, FiMail, FiCalendar, FiEdit, FiX, FiCamera, FiSave, FiLogOut, FiSettings, FiUpload, FiCrop, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from "../../hooks/UseAuth.jsx";
import { useNotifications } from "../../hooks/useNotifications";
import ProfileImage from '../../assets/logo-items/logo-2-square.png';
import Button from '../Button';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const Profile = ({
  profileImage = ProfileImage,
  size = "medium"
}) => {
  const { user: currentUser, updateProfile } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: "",
    name: "",
    email: "",
    avatar: "",
  });
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [cropMode, setCropMode] = useState(false);
  const [crop, setCrop] = useState({ unit: '%', width: 100, height: 100, x: 0, y: 0 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
   const { addNotification } = useNotifications();
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const successTimeoutRef = useRef(null);
  
  const isValidUser = currentUser && typeof currentUser === 'object';

  // Define size classes
  const sizeClasses = {
    small: "h-8 w-8",
    medium: "h-10 w-10",
    large: "h-12 w-12"
  };

  const borderClasses = {
    small: "border",
    medium: "border-2",
    large: "border-2"
  };

  const iconSizes = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg"
  };

  const sizeClass = sizeClasses[size] || sizeClasses.small;
  const borderClass = borderClasses[size] || borderClasses.small;
  const iconSize = iconSizes[size] || iconSizes.small;

  // Initialize form with user data when modal opens
  useEffect(() => {
    if (showProfileModal && currentUser) {
      const newForm = {
        username: currentUser.username || "",
        name: currentUser.name || "",
        email: currentUser.email || "",
        avatar: currentUser.avatar || "",
      };
      setTimeout(() => {
        setProfileForm(newForm);
        setAvatarPreview(currentUser.avatar || "");
      }, 0);
    } else if (!showProfileModal) {
      setTimeout(() => {
        setProfileForm({
          username: "",
          name: "",
          email: "",
          avatar: "",
        });
        setAvatarPreview("");
        setUploadError("");
        setCropMode(false);
        setImageSrc(null);
        setUploadProgress(0);
      }, 0);
    }
  }, [showProfileModal, currentUser]);

  // Clear success timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  // Update canvas when crop changes
  useEffect(() => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current && previewCanvasRef.current) {
      const image = imgRef.current;
      const canvas = previewCanvasRef.current;
      const crop = completedCrop;

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const ctx = canvas.getContext('2d');
      const pixelRatio = window.devicePixelRatio;

      canvas.width = crop.width * pixelRatio;
      canvas.height = crop.height * pixelRatio;

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      );
    }
  }, [completedCrop]);

  // Show success message
  const showSuccessMessage = (message) => {
  setSuccessMessage(message);
  setShowSuccess(true);
    
addNotification('profile_image_uploaded', {
    id: Date.now(),
    title: message
  });
  
    // Auto-hide after 3 seconds
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    
    successTimeoutRef.current = setTimeout(() => {
      setShowSuccess(false);
      setSuccessMessage("");
    }, 3000);
  };

  // Handle profile form changes
  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // If avatar URL field changes, update preview
    if (name === 'avatar') {
      setAvatarPreview(value);
    }
  };

  // Handle file input click when avatar is clicked
  const handleAvatarClick = () => {
    if (editMode && fileInputRef.current && !cropMode) {
      fileInputRef.current.click();
    }
  };

  // Simulate upload progress (for demo - replace with actual upload)
  const simulateUploadProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please upload a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    setUploadError("");
    simulateUploadProgress(); // Start progress simulation

    try {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const image = new Image();
        image.src = reader.result;
        
        image.onload = () => {
          setUploading(false);
          setUploadProgress(100);
          
          // Check image dimensions
          if (image.width > 500 || image.height > 500) {
            // Image is too large, enter crop mode
            setImageSrc(reader.result);
            setCropMode(true);
            
            // Set initial crop to center square
            const minDimension = Math.min(image.width, image.height);
            const cropWidth = Math.min(minDimension, 500);
            const cropHeight = cropWidth;
            const cropX = (image.width - cropWidth) / 2;
            const cropY = (image.height - cropHeight) / 2;
            
            setCrop({
              unit: 'px',
              width: cropWidth,
              height: cropHeight,
              x: cropX,
              y: cropY
            });
            
            // Show message about cropping
            setUploadError('Image is large. Please crop it to the desired size.');
          } else {
            // Image is small enough, use directly
            setAvatarPreview(reader.result);
            setProfileForm(prev => ({
              ...prev,
              avatar: reader.result
            }));
            showSuccessMessage('Image uploaded successfully! Click save to update your profile.');
          }
        };
        
        image.onerror = () => {
          setUploading(false);
          setUploadProgress(0);
          setUploadError('Failed to load image');
        };
      };
      
      reader.onerror = () => {
        setUploading(false);
        setUploadProgress(0);
        setUploadError('Failed to read the file');
      };
      
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload image');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle crop completion
  const handleCropComplete = (crop) => {
    setCompletedCrop(crop);
  };

  // Apply crop and generate final image
  const applyCrop = () => {
    if (!completedCrop || !previewCanvasRef.current) {
      setUploadError('Please select a crop area');
      return;
    }

    const canvas = previewCanvasRef.current;
    
    // Get cropped image as base64
    const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
    
    setAvatarPreview(croppedImage);
    setProfileForm(prev => ({
      ...prev,
      avatar: croppedImage
    }));
    
    // Exit crop mode
    setCropMode(false);
    setImageSrc(null);
    setUploadError('');
    showSuccessMessage('Image cropped successfully! Click save to update your profile.');
  };

  // Cancel crop and go back
  const cancelCrop = () => {
    setCropMode(false);
    setImageSrc(null);
    setUploadError('');

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    if (updateProfile) {
      try {
        setUploading(true);
        setUploadProgress(0);
        
        // Simulate upload progress for profile update
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 100);
        
        // In production, here you would upload the image to your server
        // and get back a URL to store
        
        // Simulate API call delay
        setTimeout(() => {
          clearInterval(progressInterval);
          setUploadProgress(100);
          
          // Update profile
          updateProfile(profileForm);
          
          setUploading(false);
          setEditMode(false);
          setCropMode(false);
          showSuccessMessage('Profile updated successfully!');
          
          // Reset progress after success
          setTimeout(() => setUploadProgress(0), 500);
        }, 1000);
        
      } catch (error) {
        console.error('Update error:', error);
        setUploadError('Failed to save profile');
        setUploading(false);
        setUploadProgress(0);
      }
    }
  };

  // Get display image
  const getDisplayImage = () => {
    if (isValidUser && currentUser.avatar && typeof currentUser.avatar === 'string' && currentUser.avatar.trim() !== "") {
      return currentUser.avatar;
    }
    return profileImage;
  };

  // Get user role - Simple two-role system
  const getUserRole = () => {
    if (!isValidUser) return "Guest";
    
    const userRole = currentUser.role;
    
    if (userRole && typeof userRole === 'string') {
      const roleLower = userRole.toLowerCase().trim();
      
      if (roleLower === 'admin' || roleLower === 'administrator') {
        return "Admin";
      }
      
      return "Users";
    }
    
    if (currentUser.email) return "Users";
    
    return "Guest";
  };

  const displayImage = getDisplayImage();
  const userRole = getUserRole();

  // Check if user is admin for conditional features
  const isAdmin = isValidUser && currentUser.role && 
    (currentUser.role.toLowerCase().trim() === 'admin' || 
     currentUser.role.toLowerCase().trim() === 'administrator');

  return (
    <>
      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg shadow-lg z-[9999] flex items-center gap-3 animate-fade-in">
          <FiCheckCircle className="text-green-500 dark:text-green-400 text-xl" />
          <div>
            <p className="font-medium">{successMessage}</p>
          </div>
          <button 
            onClick={() => setShowSuccess(false)}
            className="text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 ml-4"
          >
            <FiX size={18} />
          </button>
        </div>
      )}

      {/* Profile Avatar in Header */}
      <div className="relative group">
        <div 
          className="cursor-pointer"
          onClick={() => setShowProfileModal(true)}
        >
          {displayImage ? (
            <img
              src={displayImage}
              alt="Profile"
              className={`${sizeClass} rounded-full object-cover ${borderClass} border-gray-300 dark:border-gray-600 shadow-sm`}
              onError={(e) => {
                e.target.style.display = 'none';
                const fallback = e.target.parentElement.querySelector('.profile-fallback');
                if (fallback) {
                  fallback.style.display = 'flex';
                }
              }}
            />
          ) : null}
          
          {/* Fallback avatar if image fails or not provided */}
          <div 
            className={`${sizeClass} rounded-full bg-[#3D9B9B] flex items-center justify-center shadow-sm profile-fallback ${displayImage ? 'hidden' : 'flex'}`}
          >
            <FiUser className={`text-white ${iconSize}`} />
          </div>
        </div>
        
        {/* Tooltip with user info - Simplified as requested */}
        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="text-center">
            {/* Show username first if available */}
            {isValidUser && currentUser.username && currentUser.username.trim() !== "" ? (
              <div className="font-semibold text-gray-900 dark:text-gray-300 truncate text-sm">
                @{currentUser.username}
              </div>
            ) : isValidUser && currentUser.name ? (
              <div className="font-semibold text-gray-900 dark:text-gray-300 truncate text-sm">
                {currentUser.name}
              </div>
            ) : (
              <div className="font-semibold text-gray-900 dark:text-gray-300 truncate text-sm">
                User
              </div>
            )}
            
            {/* Only show view profile button */}
            <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setShowProfileModal(true)}
                className="text-sm text-[#3D9B9B] hover:text-[#2d7b7b] dark:text-[#3D9B9B] dark:hover:text-[#2d7b7b] font-medium w-full py-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
              >
                View Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && currentUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-300 font-roboto">Profile</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 font-roboto text-base">View and edit your profile information</p>
                </div>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    setEditMode(false);
                    setCropMode(false);
                    setUploadError("");
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FiX className="text-xl text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Crop Mode View */}
              {cropMode ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-300 mb-2">Crop Your Image</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Select the area you want to use as your profile picture</p>
                  </div>

                  {/* Crop Interface */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-[300px] overflow-auto flex justify-center">
                      {imageSrc && (
                        <ReactCrop
                          crop={crop}
                          onChange={(newCrop) => setCrop(newCrop)}
                          onComplete={handleCropComplete}
                          aspect={1}
                          circularCrop
                          className="max-h-[250px]"
                        >
                          <img
                            ref={imgRef}
                            src={imageSrc}
                            alt="Crop preview"
                            className="max-h-[250px]"
                          />
                        </ReactCrop>
                      )}
                    </div>

                    {/* Hidden canvas for final crop */}
                    <canvas
                      ref={previewCanvasRef}
                      style={{
                        display: 'none',
                      }}
                    />

                    {/* Crop Controls */}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={cancelCrop}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={applyCrop}
                        className="flex-1"
                        icon={<FiCrop className="mr-2" />}
                      >
                        Apply Crop
                      </Button>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Tip: Select a square area for best results. The image will be cropped to a circle.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Profile Header */}
                  <div className="flex flex-col items-center mb-8">
                    <div className="relative mb-4 group">
                      {/* Hidden file input */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      
                      {/* Avatar display with upload overlay in edit mode */}
                      <div 
                        className={`w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg relative ${
                          editMode ? 'cursor-pointer group' : ''
                        }`}
                        onClick={handleAvatarClick}
                      >
                        {(avatarPreview || currentUser.avatar) ? (
                          <img
                            src={avatarPreview || currentUser.avatar}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full bg-[#3D9B9B] flex items-center justify-center ${
                          (avatarPreview || currentUser.avatar) ? 'hidden' : 'flex'
                        }`}>
                          <FiUser className="text-white text-5xl" />
                        </div>
                        
                        {/* Upload overlay in edit mode */}
                        {editMode && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="text-center">
                              <FiCamera className="text-white text-2xl mx-auto mb-1" />
                              <span className="text-white text-xs font-medium">Upload Photo</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Uploading indicator */}
                        {uploading && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-2"></div>
                              <span className="text-white text-xs">Uploading...</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Camera icon indicator in edit mode */}
                      {editMode && (
                        <div className="absolute bottom-2 right-2 bg-[#3D9B9B] text-white p-2 rounded-full shadow-lg">
                          <FiCamera className="text-sm" />
                        </div>
                      )}
                    </div>
                    
                    {/* Upload Progress Bar (only in edit mode) */}
                    {editMode && uploadProgress > 0 && (
                      <div className="w-64 mb-4">
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                          <span>Upload Progress</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#3D9B9B] transition-all duration-300 ease-out"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Upload error message */}
                    {uploadError && !cropMode && (
                      <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-w-xs">
                        <p className="text-red-600 dark:text-red-400 text-sm text-center">{uploadError}</p>
                      </div>
                    )}
                    
                    <div className="text-center">
                      {editMode ? (
                        <div className="space-y-4">
                          <div className="bg-[#3D9B9B]/10 dark:bg-[#3D9B9B]/20 rounded-lg p-3">
                            <p className="font-medium text-[#3D9B9B] text-xl">
                              @{profileForm.username || "username"}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 font-roboto text-sm">Username</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-[#3D9B9B]/10 dark:bg-[#3D9B9B]/20 rounded-lg p-3">
                            <h3 className="text-xl font-bold text-[#3D9B9B] mb-1">
                              @{currentUser.username || "username"}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Username</p>
                          </div>
                          <div className="mt-2">
                            <span className={`inline-block px-3 py-1 text-xs rounded-full ${
                              userRole === 'Admin' 
                                ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300' 
                                : userRole === 'Users'
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                            }`}>
                              {userRole}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profile Information */}
                  {editMode ? (
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      {/* Upload instructions */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <FiUpload className="text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium text-blue-800 dark:text-blue-300 text-sm mb-1">Upload Profile Picture</h4>
                            <p className="text-blue-600 dark:text-blue-400 text-xs">
                              Click on your avatar above to upload a new photo. 
                              Large images (over 500x500) will be automatically cropped.
                              Supported formats: JPG, PNG, GIF, WebP (max 5MB)
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Username Field */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Username <span className="text-gray-500 dark:text-gray-400 text-xs">(required)</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">@</span>
                          <input
                            type="text"
                            name="username"
                            value={profileForm.username}
                            onChange={handleProfileFormChange}
                            className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-lg focus:ring-2 focus:ring-[#3D9B9B] focus:border-transparent outline-none"
                            placeholder="Choose a username"
                            required
                            minLength="3"
                            maxLength="30"
                          />
                        </div>
                        <p className="mt-1 text-xs font-roboto text-gray-500 dark:text-gray-400">
                          This will be your unique identifier. 3-30 characters.
                        </p>
                      </div>

                      {/* Alternative: Avatar URL Field */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Or paste image URL
                          </label>
                          <span className="text-gray-500 dark:text-gray-400 text-xs">(alternative)</span>
                        </div>
                        <input
                          type="url"
                          name="avatar"
                          value={profileForm.avatar}
                          onChange={handleProfileFormChange}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-lg focus:ring-2 focus:ring-[#3D9B9B] focus:border-transparent outline-none"
                          placeholder="https://example.com/avatar.jpg"
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          type="submit"
                          variant="primary"
                          className="flex-1 rounded-2xl"
                          disabled={uploading}
                          icon={uploading ? null : <FiSave className="mr-2" />}
                        >
                          {uploading ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                              Saving...
                            </div>
                          ) : 'Save Changes'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditMode(false);
                            setUploadError("");
                            setUploadProgress(0);
                          }}
                          className="flex-1"
                          disabled={uploading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      {/* Account Information */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-5">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-300 mb-4">Account Information</h4>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#3D9B9B]/10 dark:bg-[#3D9B9B]/20 flex items-center justify-center">
                              <FiUser className="text-[#3D9B9B]" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Username</p>
                              <p className="font-medium text-gray-900 dark:text-gray-300">@{currentUser.username || "Not set"}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#3D9B9B]/10 dark:bg-[#3D9B9B]/20 flex items-center justify-center">
                              <FiMail className="text-[#3D9B9B]" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Email Address</p>
                              <p className="font-medium text-gray-900 dark:text-gray-300">{currentUser.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#3D9B9B]/10 dark:bg-[#3D9B9B]/20 flex items-center justify-center">
                              <FiCalendar className="text-[#3D9B9B]" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Member Since</p>
                              <p className="font-medium text-gray-900 dark:text-gray-300">
                                {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : "Recently"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Admin-only features */}
                      {isAdmin && (
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-5 border border-red-100 dark:border-red-800">
                          <h4 className="font-semibold text-red-900 dark:text-red-300 mb-4">Admin Features</h4>
                          <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                            You have administrative access to the platform.
                          </p>
                          <div className="space-y-2">
                            <Button
                              variant="danger"
                              onClick={() => {
                                window.location.href = '/admin/dashboard';
                              }}
                              className="w-full"
                            >
                              Go to Admin Dashboard
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-2">
                        <Button
                          variant="primary"
                          onClick={() => setEditMode(true)}
                          className="flex-1"
                          icon={<FiEdit className="mr-2" />}
                        >
                          Edit Profile
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 rounded-b-2xl">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentUser.updatedAt ? `Last updated: ${new Date(currentUser.updatedAt).toLocaleDateString()}` : "Profile not updated yet"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;