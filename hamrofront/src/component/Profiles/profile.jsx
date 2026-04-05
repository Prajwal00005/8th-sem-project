import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useProfileStore } from '../../store/profileStore';

const Profile = () => {
  const {
    profile,
    editableProfile,
    isEditing,
    imageFile,
    fetchProfile,
    handleEdit,
    handleCancel,
    handleInputChange,
    handleImageChange,
    handleSaveChanges,
    handleUpdatePassword,
  } = useProfileStore();

  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  
  const handleSave = async () => {
    try {
      setError(null);
      const profileChanged = Object.keys(editableProfile).some(
        (key) =>
          key !== 'password' &&
          key !== 'confirm_password' &&
          editableProfile[key] !== profile[key]
      );
      if (profileChanged || imageFile) {
        await handleSaveChanges();
      }

      if (editableProfile.password || editableProfile.confirm_password) {
        await handleUpdatePassword();
      }
    } catch (err) {
      setError(err.message || 'Failed to save changes');
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F8F6]">
        <div className="text-[#5C7361] text-lg animate-pulse">Loading...</div>
      </div>
    );
  }

  const isSuperadmin = profile.role === 'superadmin';
  const showApartmentName = profile.role === 'resident' || profile.role === 'security';
  const showFollowCounts = profile.role === 'resident';

  return (
    <div className="min-h-screen bg-[#F5F8F6] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-8">
          <h2 className="text-2xl font-semibold text-[#2C3B2A] mb-8">Profile</h2>
          {(profile.error || error) && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-xl mb-6">
              {profile.error || error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Image */}
            <div className="col-span-full flex items-center gap-4">
              <img
                src={
                  imageFile
                    ? URL.createObjectURL(imageFile)
                    : profile.profileImage
                    ? `http://localhost:8000/api/v1${profile.profileImage}`
                    : 'http://localhost:8000/api/v1/media/profileImages/default.png'
                }
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border border-[#E8EFEA]"
                onError={(e) => {
                  e.target.src = 'http://localhost:8000/api/v1/media/profileImages/default.png';
                }}
              />
              <div className="flex-1">
                <label className="block text-sm text-[#5C7361] mb-2">Profile Image</label>
                {isEditing && (
                  <label className="inline-flex items-center gap-2 bg-[#395917] text-white py-2.5 px-6 rounded-lg cursor-pointer hover:bg-[#2C3B2A] transition-colors">
                    <span>Choose Image</span>
                    <input type="file" onChange={handleImageChange} className="hidden" accept="image/*" />
                  </label>
                )}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm text-[#5C7361] mb-2">Username</label>
              <p className="text-base text-[#2C3B2A] font-medium">{profile.username}</p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-[#5C7361] mb-2">Email</label>
              <p className="text-base text-[#2C3B2A] font-medium">{profile.email}</p>
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm text-[#5C7361] mb-2">First Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="first_name"
                  value={editableProfile.first_name || ''}
                  onChange={handleInputChange}
                  className="w-full text-base py-3 px-4 border border-[#E8EFEA] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#395917] transition-colors"
                />
              ) : (
                <p className="text-base text-[#2C3B2A] font-medium">{profile.first_name || 'N/A'}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm text-[#5C7361] mb-2">Last Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="last_name"
                  value={editableProfile.last_name || ''}
                  onChange={handleInputChange}
                  className="w-full text-base py-3 px-4 border border-[#E8EFEA] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#395917] transition-colors"
                />
              ) : (
                <p className="text-base text-[#2C3B2A] font-medium">{profile.last_name || 'N/A'}</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm text-[#5C7361] mb-2">Gender</label>
              {isEditing ? (
                <select
                  name="gender"
                  value={editableProfile.gender || ''}
                  onChange={handleInputChange}
                  className="w-full text-base py-3 px-4 border border-[#E8EFEA] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#395917] transition-colors"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <p className="text-base text-[#2C3B2A] font-medium">{profile.gender || 'N/A'}</p>
              )}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm text-[#5C7361] mb-2">Address</label>
              {isEditing ? (
                <textarea
                  name="address"
                  value={editableProfile.address || ''}
                  onChange={handleInputChange}
                  className="w-full text-base py-3 px-4 border border-[#E8EFEA] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#395917] transition-colors"
                  rows={4}
                />
              ) : (
                <p className="text-base text-[#2C3B2A] font-medium">{profile.address || 'N/A'}</p>
              )}
            </div>

            {/* Apartment Name */}
            {showApartmentName && (
              <div>
                <label className="block text-sm text-[#5C7361] mb-2">Apartment Name</label>
                <p className="text-base text-[#2C3B2A] font-medium">{profile.apartmentName || 'N/A'}</p>
              </div>
            )}

            {/* Password (Hidden for Superadmin) */}
            {!isSuperadmin && (
              <div className="md:col-span-2">
                <label className="block text-sm text-[#5C7361] mb-2">Password</label>
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type={passwordVisible ? 'text' : 'password'}
                        name="password"
                        value={editableProfile.password || ''}
                        onChange={handleInputChange}
                        placeholder="New Password"
                        className="w-full text-base py-3 px-4 border border-[#E8EFEA] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#395917] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#5C7361] hover:text-[#395917]"
                      >
                        {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={confirmPasswordVisible ? 'text' : 'password'}
                        name="confirm_password"
                        value={editableProfile.confirm_password || ''}
                        onChange={handleInputChange}
                        placeholder="Confirm Password"
                        className="w-full text-base py-3 px-4 border border-[#E8EFEA] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#395917] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#5C7361] hover:text-[#395917]"
                      >
                        {confirmPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-base text-[#2C3B2A] font-medium">••••••••</p>
                )}
              </div>
            )}

            {/* Followers/Following */}
            {showFollowCounts && (
              <div className="md:col-span-2 flex gap-6">
                <p className="text-sm text-[#5C7361]">
                  <span className="font-semibold text-[#2C3B2A]">{profile.followers_count}</span>{' '}
                  Followers
                </p>
                <p className="text-sm text-[#5C7361]">
                  <span className="font-semibold text-[#2C3B2A]">{profile.following_count}</span>{' '}
                  Following
                </p>
              </div>
            )}
          </div>

          {/* Edit/Save Buttons */}
          <div className="flex gap-4 mt-8">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex-1 px-6 py-2.5 bg-[#395917] text-white rounded-lg hover:bg-[#2C3B2A] transition-colors text-base font-medium"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 px-6 py-2.5 bg-white text-[#5C7361] border border-[#E8EFEA] rounded-lg hover:bg-[#E8EFEA] transition-colors text-base font-medium"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="w-full px-6 py-2.5 bg-[#395917] text-white rounded-lg hover:bg-[#2C3B2A] transition-colors text-base font-medium"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;