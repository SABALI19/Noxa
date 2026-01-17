import React, { useState, useEffect } from 'react';
import { FiUser, FiMail, FiCalendar, FiEdit, FiX, FiCamera, FiSave, FiLogOut, FiSettings } from 'react-icons/fi';
import { useAuth } from "../../hooks/UseAuth.jsx";
import ProfileImage from '../../assets/logo-items/logo-2-square.png';
import Button from '../Button';

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
      }, 0);
    }
  }, [showProfileModal, currentUser]);

  // Handle profile form changes
  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle avatar URL change
  const handleAvatarUrlChange = (e) => {
    const url = e.target.value;
    setProfileForm(prev => ({ ...prev, avatar: url }));
    setAvatarPreview(url);
  };

  // Handle file upload for avatar
  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        setProfileForm(prev => ({ ...prev, avatar: dataUrl }));
        setAvatarPreview(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle profile update
  const handleProfileUpdate = (e) => {
    e.preventDefault();
    if (updateProfile) {
      updateProfile(profileForm);
      setEditMode(false);
    }
  };

  // Get display image
  const getDisplayImage = () => {
    if (isValidUser && currentUser.avatar && typeof currentUser.avatar === 'string' && currentUser.avatar.trim() !== "") {
      return currentUser.avatar;
    }
    return profileImage;
  };

  // Get user role
  const getUserRole = () => {
    if (!isValidUser) return "Guest";
    
    if (currentUser.role && typeof currentUser.role === 'string') {
      return currentUser.role;
    }
    
    if (currentUser.email) return "Member";
    
    return "User";
  };

  const displayImage = getDisplayImage();
  const userRole = getUserRole();

  return (
    <>
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
              className={`${sizeClass} rounded-full object-cover ${borderClass} border-gray-300 shadow-sm`}
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
        
        {/* Tooltip with user info */}
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="text-center">
            {/* Show username first if available */}
            {isValidUser && currentUser.username && currentUser.username.trim() !== "" ? (
              <div className="font-medium text-gray-900 truncate">
                @{currentUser.username}
              </div>
            ) : (
              <div className="font-medium text-gray-900 truncate">
                {currentUser?.name || "User"}
              </div>
            )}
            
            {/* Show both username and name if they exist */}
            {isValidUser && currentUser.username && currentUser.username.trim() !== "" && currentUser.name && (
              <div className="text-xs text-gray-600 mt-1 truncate">
                {currentUser.name}
              </div>
            )}
            
            {isValidUser && currentUser.email && (
              <div className="text-xs text-gray-500 mt-1 truncate">
                {currentUser.email}
              </div>
            )}
            
            <div className="mt-2">
              <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                {userRole}
              </span>
            </div>
            
            <div className="mt-3">
              <button
                onClick={() => setShowProfileModal(true)}
                className="text-sm text-[#3D9B9B] hover:text-[#2D8B8B] font-medium"
              >
                View Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && currentUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-1000 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 font-roboto">Profile</h2>
                  <p className="text-gray-600 mt-1 font-roboto text-base">View and edit your profile information</p>
                </div>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    setEditMode(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="text-xl text-gray-600" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Profile Header */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative mb-4 group">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full bg-[#3D9B9B] flex items-center justify-center ${avatarPreview ? 'hidden' : 'flex'}`}>
                        <FiUser className="text-white text-5xl" />
                      </div>
                    </div>
                    
                    {/* Avatar Edit Overlay */}
                    {editMode && (
                      <>
                        <label
                          htmlFor="avatar-upload"
                          className="absolute bottom-0 right-0 bg-[#3D9B9B] text-white p-3 rounded-full shadow-lg cursor-pointer hover:bg-[#2D8B8B] transition-colors"
                          title="Change avatar"
                        >
                          <FiCamera className="w-24 h-24" />
                        </label>
                        <input
                          type="file"
                          id="avatar-upload"
                          accept="image/*"
                          className="hidden "
                          onChange={handleAvatarFileChange}
                        />
                      </>
                    )}
                  </div>
                </div>
                
                <div className="text-center">
                  {editMode ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {profileForm.name || "Set your name"}
                        </h3>
                        <p className="text-gray-600 text-sm">Full Name</p>
                      </div>
                      <div className="bg-[#3D9B9B]/10 rounded-lg p-3">
                        <p className="font-medium text-[#3D9B9B]">
                          @{profileForm.username || "username"}
                        </p>
                        <p className="text-gray-600 font-roboto text-sm">Username</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{currentUser.name}</h3>
                        <p className="text-gray-600 text-sm">Full Name</p>
                      </div>
                      {currentUser.username && currentUser.username.trim() !== "" && (
                        <div className="bg-[#3D9B9B]/10 rounded-lg p-3">
                          <p className="font-medium text-[#3D9B9B]">@{currentUser.username}</p>
                          <p className="text-gray-600 text-sm">Username</p>
                        </div>
                      )}
                      <div className="mt-2">
                        <span className="inline-block px-3 py-1 text-xs bg-[#3D9B9B]/10 text-[#3D9B9B] rounded-full">
                          {currentUser.role || "Member"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Information */}
              {editMode ? (
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  {/* Username Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username <span className="text-gray-500 text-xs">(required)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">@</span>
                      <input
                        type="text"
                        name="username"
                        value={profileForm.username}
                        onChange={handleProfileFormChange}
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3D9B9B] focus:border-transparent outline-none"
                        placeholder="Choose a username"
                        required
                        minLength="3"
                        maxLength="30"
                      />
                    </div>
                    <p className="mt-1 text-xs font-roboto text-gray-500">
                      This will be your unique identifier. 3-30 characters.
                    </p>
                  </div>

                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-gray-500 text-xs">(optional)</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileFormChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3D9B9B] focus:border-transparent outline-none"
                      placeholder="Your full name"
                    />
                  </div>

                  {/* Avatar URL Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Avatar URL <span className="text-gray-500 text-xs">(or upload above)</span>
                    </label>
                    <input
                      type="url"
                      name="avatar"
                      value={profileForm.avatar}
                      onChange={handleAvatarUrlChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3D9B9B] focus:border-transparent outline-none"
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      className="flex-1 rounded-2xl"
                    >
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditMode(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Account Information */}
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h4 className="font-semibold text-gray-900 mb-4">Account Information</h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#3D9B9B]/10 flex items-center justify-center">
                          <FiUser className="text-[#3D9B9B]" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            {currentUser.username && currentUser.username.trim() !== "" ? "Username" : "Full Name"}
                          </p>
                          <p className="font-medium text-gray-900">
                            {currentUser.username && currentUser.username.trim() !== "" ? `@${currentUser.username}` : currentUser.name}
                          </p>
                        </div>
                      </div>

                      {currentUser.username && currentUser.username.trim() !== "" && currentUser.name && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#3D9B9B]/10 flex items-center justify-center">
                            <FiUser className="text-[#3D9B9B]" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Full Name</p>
                            <p className="font-medium text-gray-900">{currentUser.name}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#3D9B9B]/10 flex items-center justify-center">
                          <FiMail className="text-[#3D9B9B]" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email Address</p>
                          <p className="font-medium text-gray-900">{currentUser.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#3D9B9B]/10 flex items-center justify-center">
                          <FiCalendar className="text-[#3D9B9B]" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Member Since</p>
                          <p className="font-medium text-gray-900">
                            {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : "Recently"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="primary"
                      onClick={() => setEditMode(true)}
                      className="flex-1"
                    >
                      Edit Profile
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl">
              <div className="text-center">
                <p className="text-sm text-gray-600">
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