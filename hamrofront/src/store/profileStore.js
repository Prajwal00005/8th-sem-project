import { create } from 'zustand';
import axios from '../utils/axiosConfig';

export const useProfileStore = create((set, get) => ({
  profile: null,
  editableProfile: { password: '', confirm_password: '' },
  isEditing: false,
  imageFile: null,

  setProfile: (data) => set({ profile: data, editableProfile: { ...data, password: '', confirm_password: '' }}),
  setEditableProfile: (updates) => set((state) => ({ editableProfile: { ...state.editableProfile, ...updates } })),
  setIsEditing: (editing) => set({ isEditing: editing }),
  setImageFile: (file) => set({ imageFile: file }),

  fetchProfile: async () => {
    try {
      const response = await axios.get('/api/v1/profile/', {
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
      });
      set({ profile: response.data, editableProfile: response.data,password: '', confirm_password: '' });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  },

  handleEdit: () => set((state) => ({
    isEditing: true,
    editableProfile: {
      ...state.profile,
      password: '',
      confirm_password: '',
    },
  })),

  handleCancel: () => {
    const { profile } = get();
    set({ editableProfile: {...profile, password: '', confirm_password: ''}, imageFile: null, isEditing: false });
  },

  handleInputChange: (e) => {
    const { name, value } = e.target;
    set((state) => ({
      editableProfile: { ...state.editableProfile, [name]: value },
    }));
  },

  handleImageChange: (e) => {
    const file = e.target.files[0];
    if (file) {
      set({ imageFile: file });
    }
  },

  handleSaveChanges: async () => {
    const { editableProfile, profile, imageFile } = get();
    const formData = new FormData();

    Object.keys(editableProfile).forEach((key) => {
      if (key !== 'password' && key !== 'confirm_password' && editableProfile[key] !== profile[key]) {
        formData.append(key, editableProfile[key]);
      }
    });

    if (imageFile) {
      formData.append('profileImage', imageFile);
    }

    try {
      const response = await axios.put('/api/v1/profile/updateProfile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
      });
      set({ 
        profile: response.data, 
        editableProfile: { ...response.data, password: '', confirm_password: '' },
        isEditing: false, 
        imageFile: null 
      });
      console.log('Profile updated successfully:', response.data);
    } catch (error) {
      console.error('Error updating profile:', error.response?.data || error.message);
    }
  },

  handleUpdatePassword: async () => {
    const { editableProfile } = get();
    const { password, confirm_password } = editableProfile;

    console.log('Password update payload:', { password, confirm_password });

    if (!password || !confirm_password) {
      throw new Error('Both password and confirm password are required');
    }

    if (password !== confirm_password) {
      throw new Error('Passwords do not match');
    }

    try {
      const response = await axios.put(
        '/api/v1/profile/updatePassword/',
        { password, confirm_password },
        {
          headers: {
            Authorization: `Token ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );
        console.log('Password updated successfully:', response.data);
      set((state) => ({
        editableProfile: { ...state.editableProfile, password: '', confirm_password: '' },
      }));
      console.log('Password updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating password:', error.response?.data || error.message);
      throw error;
    }
  },

}));