import React, { useState, useEffect, useRef } from 'react';
import { FiUser, FiMail, FiCalendar, FiEdit, FiX, FiCamera, FiSave, FiLogOut, FiSettings, FiUpload, FiCrop, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from "../../hooks/UseAuth.jsx";
import { useNotifications } from "../../hooks/useNotifications";
import ProfileImage from '../../assets/logo-items/logo-2-square.png';
import Button from '../Button';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// ─── DiceBear library imports ───────────────────────────────────────────────
import { createAvatar } from '@dicebear/core';
import {
  avataaars,
  micah,
  bottts,
  lorelei,
  adventurer,
  bigSmile,
  croodles,
  funEmoji,
  pixelArt,
  thumbs,
  shapes,
  icons,
} from '@dicebear/collection';
// ────────────────────────────────────────────────────────────────────────────

const AVATAR_STYLES = [
  { style: 'avataaars', label: 'Illustrated' },
  { style: 'micah',     label: 'Minimal'     },
  { style: 'bottts',    label: 'Robot'        },
  { style: 'lorelei',   label: 'Artistic'     },
  { style: 'adventurer',label: 'Adventurer'   },
  { style: 'big-smile', label: 'Big Smile'    },
  { style: 'croodles',  label: 'Croodles'     },
  { style: 'fun-emoji', label: 'Emoji'        },
  { style: 'pixel-art', label: 'Pixel Art'    },
  { style: 'thumbs',    label: 'Thumbs'       },
  { style: 'shapes',    label: 'Shapes'       },
  { style: 'icons',     label: 'Icons'        },
];

// Map style id → DiceBear collection object
const STYLE_MAP = {
  'avataaars':  avataaars,
  'micah':      micah,
  'bottts':     bottts,
  'lorelei':    lorelei,
  'adventurer': adventurer,
  'big-smile':  bigSmile,
  'croodles':   croodles,
  'fun-emoji':  funEmoji,
  'pixel-art':  pixelArt,
  'thumbs':     thumbs,
  'shapes':     shapes,
  'icons':      icons,
};

/**
 * Generate a DiceBear avatar data URI locally — no network request.
 * Returns a "data:image/svg+xml;base64,..." string usable as <img src>.
 */
const getAvatarDataUri = (style, seed) => {
  const collection = STYLE_MAP[style];
  if (!collection) return null;
  try {
    const avatar = createAvatar(collection, {
      seed: seed || 'default',
      backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
      radius: 50,
    });
    return avatar.toDataUri(); // "data:image/svg+xml;base64,..."
  } catch {
    return null;
  }
};

// Pre-compute a fixed set of seed names for the picker grid
const PICKER_SEEDS = [
  'Alpha','Beta','Gamma','Delta','Epsilon',
  'Zeta','Eta','Theta','Iota','Kappa',
  'Lambda','Mu','Nu','Xi','Omicron',
  'Pi','Rho','Sigma','Tau','Upsilon',
];

const Profile = ({
  profileImage = ProfileImage,
  size = "medium"
}) => {
  const { user: currentUser, updateProfile } = useAuth();
  const [showProfileModal, setShowProfileModal]   = useState(false);
  const [editMode, setEditMode]                   = useState(false);
  const [profileForm, setProfileForm]             = useState({ username: "", name: "", email: "", avatar: "" });
  const [avatarPreview, setAvatarPreview]         = useState("");
  const [uploading, setUploading]                 = useState(false);
  const [uploadProgress, setUploadProgress]       = useState(0);
  const [uploadError, setUploadError]             = useState("");
  const [showSuccess, setShowSuccess]             = useState(false);
  const [successMessage, setSuccessMessage]       = useState("");
  const [cropMode, setCropMode]                   = useState(false);
  const [showAvatarPicker, setShowAvatarPicker]   = useState(false);
  const [showAvatarViewer, setShowAvatarViewer]   = useState(false);
  const [selectedAvatarStyle, setSelectedAvatarStyle] = useState('avataaars');
  const [selectedAvatarSeed, setSelectedAvatarSeed]   = useState(null);
  const [crop, setCrop]                           = useState({ unit: '%', width: 100, height: 100, x: 0, y: 0 });
  const [completedCrop, setCompletedCrop]         = useState(null);
  const [imageSrc, setImageSrc]                   = useState(null);
  const { addNotification }                       = useNotifications();
  const fileInputRef                              = useRef(null);
  const imgRef                                    = useRef(null);
  const previewCanvasRef                          = useRef(null);
  const successTimeoutRef                         = useRef(null);

  const isValidUser = currentUser && typeof currentUser === 'object';

  const sizeClasses  = { small: "h-8 w-8",   medium: "h-10 w-10", large: "h-12 w-12" };
  const borderClasses = { small: "border",   medium: "border-2",   large: "border-2"  };
  const iconSizes    = { small: "text-sm",   medium: "text-base",  large: "text-lg"   };

  const sizeClass  = sizeClasses[size]  || sizeClasses.small;
  const borderClass = borderClasses[size] || borderClasses.small;
  const iconSize   = iconSizes[size]    || iconSizes.small;

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (showProfileModal && currentUser) {
      setTimeout(() => {
        setProfileForm({
          username: currentUser.username || "",
          name:     currentUser.name     || "",
          email:    currentUser.email    || "",
          avatar:   currentUser.avatar   || "",
        });
        setAvatarPreview(currentUser.avatar || "");
      }, 0);
    } else if (!showProfileModal) {
      setTimeout(() => {
        setProfileForm({ username: "", name: "", email: "", avatar: "" });
        setAvatarPreview("");
        setUploadError("");
        setCropMode(false);
        setShowAvatarPicker(false);
        setSelectedAvatarSeed(null);
        setImageSrc(null);
        setUploadProgress(0);
      }, 0);
    }
  }, [showProfileModal, currentUser]);

  useEffect(() => () => { if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current); }, []);

  useEffect(() => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current && previewCanvasRef.current) {
      const image    = imgRef.current;
      const canvas   = previewCanvasRef.current;
      const c        = completedCrop;
      const scaleX   = image.naturalWidth  / image.width;
      const scaleY   = image.naturalHeight / image.height;
      const ctx      = canvas.getContext('2d');
      const pixelRatio = window.devicePixelRatio;
      canvas.width   = c.width  * pixelRatio;
      canvas.height  = c.height * pixelRatio;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(image, c.x * scaleX, c.y * scaleY, c.width * scaleX, c.height * scaleY, 0, 0, c.width, c.height);
    }
  }, [completedCrop]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    const type = typeof message === "string" && message.toLowerCase().includes("image")
      ? "profile_image_uploaded" : "profile_updated";
    addNotification(type, { id: Date.now(), title: message });
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    successTimeoutRef.current = setTimeout(() => { setShowSuccess(false); setSuccessMessage(""); }, 3000);
  };

  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
    if (name === 'avatar') setAvatarPreview(value);
  };

  const handleAvatarClick = () => {
    if (editMode && fileInputRef.current && !cropMode) fileInputRef.current.click();
  };

  const handleOpenAvatarViewer = () => {
    setShowAvatarViewer(true);
  };

  // ── Avatar picker ──────────────────────────────────────────────────────────
  /**
   * Called when the user clicks one of the generated avatars in the picker.
   * Generates the data URI locally and sets it as the preview.
   */
  const handleSelectAvatar = (seed) => {
    const dataUri = getAvatarDataUri(selectedAvatarStyle, seed);
    if (!dataUri) return;
    setSelectedAvatarSeed(seed);
    setAvatarPreview(dataUri);
    setProfileForm(prev => ({ ...prev, avatar: dataUri }));
  };

  // ── File upload ────────────────────────────────────────────────────────────
  const simulateUploadProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + 10;
      });
    }, 100);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) { setUploadError('Please upload a valid image file (JPEG, PNG, GIF, WebP)'); return; }
    if (file.size > 5 * 1024 * 1024)    { setUploadError('Image size should be less than 5MB'); return; }
    setUploading(true);
    setUploadError("");
    simulateUploadProgress();
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const image = new Image();
        image.src = reader.result;
        image.onload = () => {
          setUploading(false);
          setUploadProgress(100);
          if (image.width > 500 || image.height > 500) {
            setImageSrc(reader.result);
            setCropMode(true);
            const minDim = Math.min(image.width, image.height);
            const cw = Math.min(minDim, 500);
            setCrop({ unit: 'px', width: cw, height: cw, x: (image.width - cw) / 2, y: (image.height - cw) / 2 });
            setUploadError('Image is large. Please crop it to the desired size.');
          } else {
            setAvatarPreview(reader.result);
            setProfileForm(prev => ({ ...prev, avatar: reader.result }));
            showSuccessMessage('Image uploaded successfully! Click save to update your profile.');
          }
        };
        image.onerror = () => { setUploading(false); setUploadProgress(0); setUploadError('Failed to load image'); };
      };
      reader.onerror = () => { setUploading(false); setUploadProgress(0); setUploadError('Failed to read the file'); };
      reader.readAsDataURL(file);
    } catch {
      setUploadError('Failed to upload image');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCropComplete = (c) => setCompletedCrop(c);

  const applyCrop = () => {
    if (!completedCrop || !previewCanvasRef.current) { setUploadError('Please select a crop area'); return; }
    const cropped = previewCanvasRef.current.toDataURL('image/jpeg', 0.9);
    setAvatarPreview(cropped);
    setProfileForm(prev => ({ ...prev, avatar: cropped }));
    setCropMode(false);
    setImageSrc(null);
    setUploadError('');
    showSuccessMessage('Image cropped successfully! Click save to update your profile.');
  };

  const cancelCrop = () => {
    setCropMode(false);
    setImageSrc(null);
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!updateProfile) return;
    try {
      setUploading(true);
      setUploadProgress(40);
      const result = await updateProfile(profileForm);
      setUploadProgress(100);
      setUploading(false);
      setEditMode(false);
      setCropMode(false);
      setShowAvatarPicker(false);
      setSelectedAvatarSeed(null);
      showSuccessMessage(result?.message || 'Profile updated successfully!');
      setTimeout(() => setUploadProgress(0), 500);
    } catch (error) {
      setUploadError(error?.message || 'Failed to save profile');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // ── Display helpers ────────────────────────────────────────────────────────
  const getDisplayImage = () => {
    if (isValidUser && currentUser.avatar && typeof currentUser.avatar === 'string' && currentUser.avatar.trim() !== "") {
      return currentUser.avatar;
    }
    return profileImage;
  };

  const getUserRole = () => {
    if (!isValidUser) return "Guest";
    const r = currentUser.role;
    if (r && typeof r === 'string') {
      const rl = r.toLowerCase().trim();
      if (rl === 'admin' || rl === 'administrator') return "Admin";
      return "Users";
    }
    if (currentUser.email) return "Users";
    return "Guest";
  };

  const displayImage = getDisplayImage();
  const isAdmin = isValidUser && currentUser.role &&
    (currentUser.role.toLowerCase().trim() === 'admin' || currentUser.role.toLowerCase().trim() === 'administrator');

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Success toast ── */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg shadow-lg z-[9999] flex items-center gap-3 animate-fade-in">
          <FiCheckCircle className="text-green-500 dark:text-green-400 text-xl" />
          <p className="font-medium">{successMessage}</p>
          <button onClick={() => setShowSuccess(false)} className="text-green-700 dark:text-green-300 hover:text-green-900 ml-4">
            <FiX size={18} />
          </button>
        </div>
      )}

      {/* ── Avatar button + hover card ── */}
      <div className="relative group">
        <div className="cursor-pointer" onClick={() => setShowProfileModal(true)}>
          {displayImage ? (
            <img
              src={displayImage}
              alt="Profile"
              className={`${sizeClass} rounded-full object-cover ${borderClass} border-gray-300 dark:border-gray-600 shadow-sm`}
              onError={(e) => {
                e.target.style.display = 'none';
                const fb = e.target.parentElement.querySelector('.profile-fallback');
                if (fb) fb.style.display = 'flex';
              }}
            />
          ) : null}
          <div className={`${sizeClass} rounded-full bg-[#3D9B9B] flex items-center justify-center shadow-sm profile-fallback ${displayImage ? 'hidden' : 'flex'}`}>
            <FiUser className={`text-white ${iconSize}`} />
          </div>
        </div>

        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="text-center">
            {isValidUser && (currentUser.username?.trim() || currentUser.name) ? (
              <div className="font-semibold text-gray-900 dark:text-gray-300 truncate text-sm">
                {currentUser.username?.trim() ? `@${currentUser.username}` : currentUser.name}
              </div>
            ) : (
              <div className="font-semibold text-gray-900 dark:text-gray-300 text-sm">User</div>
            )}
            <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setShowProfileModal(true)}
                className="text-sm text-[#3D9B9B] hover:text-[#2d7b7b] font-medium w-full py-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
              >
                View Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Profile modal ── */}
      {showProfileModal && currentUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto scrollbar-hide">

            {/* Modal header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-300 font-roboto">Profile</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 text-base">View and edit your profile information</p>
                </div>
                <button
                  onClick={() => { setShowProfileModal(false); setEditMode(false); setCropMode(false); setShowAvatarPicker(false); setShowAvatarViewer(false); setUploadError(""); }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FiX className="text-xl text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* ── Crop mode ── */}
              {cropMode ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-300 mb-2">Crop Your Image</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Select the area you want to use as your profile picture</p>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-[300px] overflow-auto flex justify-center">
                      {imageSrc && (
                        <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={handleCropComplete} aspect={1} circularCrop className="max-h-[250px]">
                          <img ref={imgRef} src={imageSrc} alt="Crop preview" className="max-h-[250px]" />
                        </ReactCrop>
                      )}
                    </div>
                    <canvas ref={previewCanvasRef} style={{ display: 'none' }} />
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={cancelCrop} className="flex-1">Cancel</Button>
                      <Button variant="primary" onClick={applyCrop} className="flex-1" icon={<FiCrop className="mr-2" />}>Apply Crop</Button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Tip: Select a square area for best results.</p>
                  </div>
                </div>

              ) : (
                <>
                  {/* ── Avatar preview ── */}
                  <div className="flex flex-col items-center mb-8">
                    <div className="relative mb-4 group">
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                      <div
                        className={`w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg relative ${editMode ? 'cursor-pointer' : 'cursor-zoom-in'}`}
                        onClick={() => {
                          if (editMode) {
                            handleAvatarClick();
                            return;
                          }
                          handleOpenAvatarViewer();
                        }}
                      >
                        {(avatarPreview || currentUser.avatar) ? (
                          <img
                            src={avatarPreview || currentUser.avatar}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        <div className={`w-full h-full bg-[#3D9B9B] items-center justify-center ${(avatarPreview || currentUser.avatar) ? 'hidden' : 'flex'}`}>
                          <FiUser className="text-white text-5xl" />
                        </div>
                        {editMode && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="text-center">
                              <FiCamera className="text-white text-2xl mx-auto mb-1" />
                              <span className="text-white text-xs font-medium">Upload Photo</span>
                            </div>
                          </div>
                        )}
                        {uploading && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-2" />
                              <span className="text-white text-xs">Uploading...</span>
                            </div>
                          </div>
                        )}
                      </div>
                      {editMode && (
                        <div className="absolute bottom-2 right-2 bg-[#3D9B9B] text-white p-2 rounded-full shadow-lg">
                          <FiCamera className="text-sm" />
                        </div>
                      )}
                    </div>

                    {/* ── Avatar picker toggle ── */}
                    {editMode && (
                      <button
                        type="button"
                        onClick={() => setShowAvatarPicker(prev => !prev)}
                        className="mt-2 text-sm text-[#3D9B9B] hover:text-[#2d7b7b] font-medium flex items-center gap-1 transition-colors"
                      >
                        <FiUser className="text-base" />
                        {showAvatarPicker ? 'Hide ' : 'Choose Avatar'}
                      </button>
                    )}
                    {!editMode && (
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">Click avatar to view full image</p>
                    )}
                  </div>

                  {/* ── Avatar picker panel ── */}
                  {editMode && showAvatarPicker && (
                    <div className="mb-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                      {/* Style tabs */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {AVATAR_STYLES.map(({ style, label }) => (
                          <button
                            key={style}
                            type="button"
                            onClick={() => { setSelectedAvatarStyle(style); setSelectedAvatarSeed(null); }}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                              selectedAvatarStyle === style
                                ? 'bg-[#3D9B9B] text-white shadow'
                                : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-500 hover:border-[#3D9B9B]'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {/* Avatar grid — generated locally via createAvatar */}
                      <div className="grid grid-cols-5 gap-3">
                        {PICKER_SEEDS.map((seed) => {
                          const dataUri = getAvatarDataUri(selectedAvatarStyle, seed);
                          const isSelected = selectedAvatarSeed === seed;
                          return (
                            <button
                              key={seed}
                              type="button"
                              onClick={() => handleSelectAvatar(seed)}
                              className={`rounded-full overflow-hidden transition-all focus:outline-none ${
                                isSelected
                                  ? 'ring-4 ring-[#3D9B9B] ring-offset-2 scale-110 shadow-lg'
                                  : 'ring-2 ring-transparent hover:ring-[#3D9B9B]/50 hover:scale-105'
                              }`}
                              title={seed}
                            >
                              {dataUri ? (
                                <img src={dataUri} alt={seed} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center aspect-square">
                                  <FiUser className="text-gray-400" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                        Generated locally · No network requests · {AVATAR_STYLES.find(s => s.style === selectedAvatarStyle)?.label} style
                      </p>
                    </div>
                  )}

                  {/* ── Upload error ── */}
                  {uploadError && (
                    <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                      <FiX className="flex-shrink-0" />
                      {uploadError}
                    </div>
                  )}

                  {/* ── Upload progress ── */}
                  {uploading && uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-[#3D9B9B] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* ── Profile fields ── */}
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    {/* Username */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <FiUser className="inline mr-2 text-[#3D9B9B]" />Username
                      </label>
                      {editMode ? (
                        <input
                          type="text" name="username" value={profileForm.username}
                          onChange={handleProfileFormChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#3D9B9B] focus:border-transparent outline-none"
                        />
                      ) : (
                        <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100">
                          {currentUser.username || "—"}
                        </p>
                      )}
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <FiUser className="inline mr-2 text-[#3D9B9B]" />Full Name
                      </label>
                      {editMode ? (
                        <input
                          type="text" name="name" value={profileForm.name}
                          onChange={handleProfileFormChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#3D9B9B] focus:border-transparent outline-none"
                        />
                      ) : (
                        <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100">
                          {currentUser.name || "—"}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <FiMail className="inline mr-2 text-[#3D9B9B]" />Email
                      </label>
                      {editMode ? (
                        <input
                          type="email" name="email" value={profileForm.email}
                          onChange={handleProfileFormChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#3D9B9B] focus:border-transparent outline-none"
                        />
                      ) : (
                        <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100">
                          {currentUser.email || "—"}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-2">
                      {editMode ? (
                        <>
                          <Button
                            type="button" variant="outline"
                            onClick={() => { setEditMode(false); setShowAvatarPicker(false); setAvatarPreview(currentUser.avatar || ""); setUploadError(""); }}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit" variant="primary"
                            disabled={uploading}
                            className="flex-1 rounded-2xl"
                            icon={<FiSave className="mr-2" />}
                          >
                            {uploading ? 'Saving…' : 'Save Changes'}
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button" variant="primary"
                          onClick={() => setEditMode(true)}
                          className="flex-1 rounded-2xl"
                          icon={<FiEdit className="mr-2" />}
                        >
                          Edit Profile
                        </Button>
                      )}
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showAvatarViewer && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1200] flex items-center justify-center p-4"
          onClick={() => setShowAvatarViewer(false)}
        >
          <div
            className="relative max-w-lg w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowAvatarViewer(false)}
              className="absolute top-3 right-3 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close avatar viewer"
            >
              <FiX className="text-gray-700 dark:text-gray-200" />
            </button>
            <div className="pt-6">
              <img
                src={avatarPreview || currentUser?.avatar || displayImage}
                alt="Profile avatar preview"
                className="w-full h-auto max-h-[70vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;
